import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { currentCustomer, requireStaff } from "@/lib/server/auth";
import { couponDiscount, loadCatalog, priceLine, type PricedLine } from "@/lib/server/catalog";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/orders";
import { lineSchema } from "@/lib/server/schemas";
import { bulkDiscountFor, deliveryChargeFor } from "@/lib/config";
import { isBdCity } from "@/lib/data/cities";
import { isBdPhone, normalizePhone } from "@/lib/validators";

export const dynamic = "force-dynamic";

const schema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Please enter your name.").max(100),
    phone: z.string().trim().refine(isBdPhone, "Enter a valid Bangladeshi mobile number."),
  }),
  delivery: z.object({
    address: z.string().trim().min(1, "Please enter your address.").max(500),
    city: z.string().trim().refine(isBdCity, "Please choose your city."),
    notes: z.string().trim().max(500).default(""),
  }), // the delivery charge is calculated here from the city, never taken from the client
  items: z.array(lineSchema).min(1, "Your bag is empty.").max(50),
  couponCode: z.string().trim().toUpperCase().max(30).nullish(),
});

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => "ILD-" + Array.from({ length: 4 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("");

export const POST = route(async (req) => {
  const input = await body(req, schema);
  const customer = await currentCustomer();
  const charge = deliveryChargeFor(input.delivery.city);
  const phoneKey = normalizePhone(input.customer.phone);

  for (let attempt = 0; ; attempt++) {
    try {
      const order = await db.$transaction(async (tx) => {
        const cat = await loadCatalog(tx);

        // 1. Authoritative prices; merge duplicate lines.
        const merged = new Map<string, PricedLine>();
        for (const l of input.items) {
          const priced = priceLine(cat, l);
          if (!priced) throw new HttpError(409, "An item in your bag is no longer available. Please review your bag.");
          const prev = merged.get(priced.lineKey);
          if (prev) prev.qty += priced.qty; else merged.set(priced.lineKey, priced);
        }
        const lines = [...merged.values()];
        if (lines.some((l) => l.qty > 20)) throw new HttpError(400, "Maximum 20 per item.");
        const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
        const bulkDiscount = bulkDiscountFor(subtotal);

        // 2. Stock: atomic conditional decrement (no oversell under concurrency).
        const perItem = new Map<string, number>();
        for (const l of lines) perItem.set(l.itemId, (perItem.get(l.itemId) ?? 0) + l.qty);
        for (const [itemId, qty] of perItem) {
          const where = /^\d+$/.test(itemId) ? { productId: Number(itemId) } : itemId.startsWith("oil-") ? { oilId: itemId } : { giftSetId: itemId };
          const res = await tx.inventoryItem.updateMany({
            where: { ...where, stock: { gte: qty } },
            data: { stock: { decrement: qty }, ordered: { increment: qty }, inTransit: { increment: qty } },
          });
          if (res.count === 0) {
            const exists = await tx.inventoryItem.findFirst({ where });
            if (exists) throw new HttpError(409, "Sorry, an item in your bag is out of stock.");
          }
        }

        // 3. Coupon, validated now: active, not expired, within max uses, and once per phone number.
        let discount = 0;
        let couponCode: string | null = null;
        if (input.couponCode) {
          const c = await tx.coupon.findUnique({ where: { code: input.couponCode } });
          if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date())) throw new HttpError(400, "That discount code is no longer valid.");
          if (await tx.couponRedemption.findUnique({ where: { code_phone: { code: c.code, phone: phoneKey } } })) {
            throw new HttpError(400, "This discount code has already been used with this phone number.");
          }
          if (c.maxUses !== null) {
            const used = await tx.coupon.updateMany({ where: { code: c.code, uses: { lt: c.maxUses } }, data: { uses: { increment: 1 } } });
            if (used.count === 0) throw new HttpError(400, "That discount code has been fully used.");
          } else {
            await tx.coupon.update({ where: { code: c.code }, data: { uses: { increment: 1 } } });
          }
          discount = couponDiscount(c, subtotal - bulkDiscount); // the coupon applies to what is left after the large-order discount
          couponCode = c.code;
        }

        // 4. Create the order (Cash on Delivery is the only payment option) with a unique id.
        let id = newId();
        while (await tx.order.findUnique({ where: { id } })) id = newId();
        const created = await tx.order.create({
          data: {
            id, customerId: customer?.id ?? null,
            customerName: input.customer.name, customerPhone: input.customer.phone, customerEmail: customer?.email ?? null,
            address: input.delivery.address, city: input.delivery.city, notes: input.delivery.notes, deliveryCharge: charge,
            paymentMethod: "COD", paymentType: "Cash on delivery", provider: "Pay on delivery", payerAccount: "", reference: "Cash on Delivery",
            subtotal, bulkDiscount, discount, couponCode, grandTotal: Math.max(0, subtotal - bulkDiscount - discount) + charge,
            items: { create: lines.map((l) => ({ itemId: l.itemId, lineKey: l.lineKey, name: l.name, detail: l.detail, sizeMl: l.sizeMl, isFull: l.isFull, unitPrice: l.unitPrice, qty: l.qty })) },
          },
          include: { items: true },
        });
        if (couponCode) await tx.couponRedemption.create({ data: { code: couponCode, phone: phoneKey, orderId: created.id } });
        return created;
      });
      return ok(serializeOrder(order), 201);
    } catch (e) {
      // Order-id collision (or a racing double-submit of the same coupon): retry; the checks above then give the right message.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 3) continue;
      throw e;
    }
  }
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["received", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
});

/** Staff: paginated orders, newest first. `?page=1&pageSize=20&status=shipped` */
export const GET = route(async (req) => {
  await requireStaff();
  const q = listQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  const where = q.status ? { status: q.status.toUpperCase() as "RECEIVED" } : {};
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, include: { items: true }, orderBy: [{ placedAt: "desc" }, { id: "asc" }], skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
  ]);
  return ok({ items: orders.map(serializeOrder), page: q.page, pageSize: q.pageSize, total, pages: Math.max(1, Math.ceil(total / q.pageSize)) });
});
