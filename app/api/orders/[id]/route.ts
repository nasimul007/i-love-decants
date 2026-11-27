import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/orders";
import { inventoryWhere, stockByItem } from "@/lib/server/stock";
import { normalizePhone } from "@/lib/validators";

const schema = z.object({ status: z.enum(["received", "confirmed", "shipped", "delivered", "cancelled"]) });

type Status = "RECEIVED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/**
 * Staff: move an order through its lifecycle and keep the stock right.
 *  - Cancelling puts the ml (or pieces) back; re-opening a cancelled order takes them out again (and fails if they are gone).
 *  - "In transit" counts everything still open; it clears when an order is delivered or cancelled.
 */
export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("orders");
  const { id } = await params;
  const next = (await body(req, schema)).status.toUpperCase() as Status;
  const order = await db.$transaction(async (tx) => {
    const cur = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!cur) throw new HttpError(404, "Order not found.");
    if (cur.status === next) return cur;

    const open = (s: string) => s !== "DELIVERED" && s !== "CANCELLED";
    const reserve = cur.status === "CANCELLED";         // stock was returned earlier: take it out again
    const release = next === "CANCELLED";               // give the stock back
    const transitDelta = (open(next) ? 1 : 0) - (open(cur.status) ? 1 : 0); // +1 / 0 / -1 times the order quantity

    for (const [itemId, need] of stockByItem(cur.items)) {
      const where = inventoryWhere(itemId);
      const inv = await tx.inventoryItem.findFirst({ where });
      if (!inv) continue;
      if (reserve) {
        const res = await tx.inventoryItem.updateMany({
          where: { id: inv.id, stock: { gte: need } },
          data: { stock: { decrement: need }, ordered: { increment: need }, inTransit: { increment: open(next) ? need : 0 } },
        });
        if (res.count === 0) throw new HttpError(409, `Not enough stock of ${inv.name} to re-open this order.`);
      } else {
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            inTransit: Math.max(0, inv.inTransit + transitDelta * need),
            ...(release ? { stock: inv.stock + need, ordered: Math.max(0, inv.ordered - need) } : {}),
          },
        });
      }
    }
    // A cancelled order doesn't use up the coupon: free the customer's one-time use and the code's use count; re-opening takes them again.
    if (cur.couponCode && (release || reserve)) {
      const code = cur.couponCode;
      if (release) {
        await tx.couponRedemption.deleteMany({ where: { orderId: id } });
        await tx.coupon.updateMany({ where: { code, uses: { gt: 0 } }, data: { uses: { decrement: 1 } } });
      } else {
        const c = await tx.coupon.updateMany({ where: { code }, data: { uses: { increment: 1 } } });
        const once = c.count > 0 && (await tx.coupon.findUnique({ where: { code } }))?.oncePerCustomer;
        if (once && !await tx.couponRedemption.findUnique({ where: { code_phone: { code, phone: normalizePhone(cur.customerPhone) } } }))
          await tx.couponRedemption.create({ data: { code, phone: normalizePhone(cur.customerPhone), orderId: id } });
      }
    }
    return tx.order.update({ where: { id }, data: { status: next }, include: { items: true } });
  });
  return ok(serializeOrder(order));
});

/** Staff: delete a cancelled order (e.g. a test order). Its stock was already returned when it was cancelled. */
export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("orders");
  const { id } = await params;
  const cur = await db.order.findUnique({ where: { id } });
  if (!cur) throw new HttpError(404, "Order not found.");
  if (cur.status !== "CANCELLED") throw new HttpError(409, "Only cancelled orders can be deleted. Cancel it first.");
  await db.$transaction([db.couponRedemption.deleteMany({ where: { orderId: id } }), db.order.delete({ where: { id } })]);
  return ok({ deleted: id });
});
