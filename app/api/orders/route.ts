import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentCustomer, requireStaff } from "@/lib/server/auth";
import { couponDiscount, deliveryCharge, loadCatalog, priceLine, type PricedLine } from "@/lib/server/catalog";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/orders";
import { lineSchema } from "@/lib/server/schemas";
import { isBdPhone } from "@/lib/validators";

export const dynamic = "force-dynamic";

const PAYMENT = {
  BANK: { type: "Bank transfer", providers: ["Bank A", "Bank B", "Bank C"] },
  WALLET: { type: "Wallet payment", providers: ["Wallet A", "Wallet B", "Wallet C"] },
  COD: { type: "Cash on delivery", providers: [] as string[] },
} as const;

const schema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, "Please enter your name.").max(100),
    phone: z.string().trim().refine(isBdPhone, "Enter a valid Bangladeshi mobile number."),
  }),
  delivery: z.object({
    address: z.string().trim().min(1, "Please enter your address.").max(500),
    city: z.string().trim().min(1, "Please enter your city.").max(100),
    notes: z.string().trim().max(500).default(""),
    charge: z.number().int(), // must match a configured zone; the server picks the amount
  }),
  payment: z.object({
    method: z.enum(["BANK", "WALLET", "COD"]),
    provider: z.string().trim().max(60).default(""),
    payerAccount: z.string().trim().max(60).default(""),
    reference: z.string().trim().max(100).default(""),
  }),
  items: z.array(lineSchema).min(1, "Your bag is empty.").max(50),
  couponCode: z.string().trim().toUpperCase().max(30).nullish(),
});

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => "ILD-" + Array.from({ length: 4 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("");

export const POST = route(async (req) => {
  const input = await body(req, schema);
  const customer = await currentCustomer();

  const charge = deliveryCharge(input.delivery.charge);
  if (charge === null) throw new HttpError(400, "Invalid delivery option.");

  const pay = PAYMENT[input.payment.method];
  if (input.payment.method !== "COD") {
    if (!(pay.providers as readonly string[]).includes(input.payment.provider)) throw new HttpError(400, "Choose a payment provider.");
    if (!input.payment.payerAccount) throw new HttpError(400, "Please enter your account or wallet number.");
    if (!input.payment.reference) throw new HttpError(400, "Please enter the transaction reference.");
  }

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

        // 3. Coupon, validated now (not trusted from the client).
        let discount = 0;
        let couponCode: string | null = null;
        if (input.couponCode) {
          const c = await tx.coupon.findUnique({ where: { code: input.couponCode } });
          if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date())) throw new HttpError(400, "That discount code is no longer valid.");
          if (c.maxUses !== null) {
            const used = await tx.coupon.updateMany({ where: { code: c.code, uses: { lt: c.maxUses } }, data: { uses: { increment: 1 } } });
            if (used.count === 0) throw new HttpError(400, "That discount code has been fully used.");
          } else {
            await tx.coupon.update({ where: { code: c.code }, data: { uses: { increment: 1 } } });
          }
          discount = couponDiscount(c, subtotal);
          couponCode = c.code;
        }

        // 4. Create the order with a unique id.
        let id = newId();
        while (await tx.order.findUnique({ where: { id } })) id = newId();
        return tx.order.create({
          data: {
            id, customerId: customer?.id ?? null,
            customerName: input.customer.name, customerPhone: input.customer.phone, customerEmail: customer?.email ?? null,
            address: input.delivery.address, city: input.delivery.city, notes: input.delivery.notes, deliveryCharge: charge,
            paymentMethod: input.payment.method, paymentType: pay.type,
            provider: input.payment.method === "COD" ? "Pay on delivery" : input.payment.provider,
            payerAccount: input.payment.method === "COD" ? "" : input.payment.payerAccount,
            reference: input.payment.method === "COD" ? "Cash on Delivery" : input.payment.reference,
            subtotal, discount, couponCode, grandTotal: Math.max(0, subtotal - discount) + charge,
            items: { create: lines.map((l) => ({ itemId: l.itemId, lineKey: l.lineKey, name: l.name, detail: l.detail, sizeMl: l.sizeMl, isFull: l.isFull, unitPrice: l.unitPrice, qty: l.qty })) },
          },
          include: { items: true },
        });
      });
      return ok(serializeOrder(order), 201);
    } catch (e) {
      // Order-id collision under concurrency: retry the whole transaction.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 3) continue;
      throw e;
    }
  }
});

/** Staff: list all orders (any staff member). */
export const GET = route(async () => {
  await requireStaff();
  const orders = await db.order.findMany({ include: { items: true }, orderBy: { placedAt: "desc" }, take: 500 });
  return ok(orders.map(serializeOrder));
});
