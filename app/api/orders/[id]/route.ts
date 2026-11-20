import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/orders";

const schema = z.object({ status: z.enum(["received", "confirmed", "shipped", "delivered", "cancelled"]) });

/** Staff: move an order through its lifecycle; closing it settles the inventory "in transit" counters. */
export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff();
  const { id } = await params;
  const next = (await body(req, schema)).status.toUpperCase() as "RECEIVED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  const order = await db.$transaction(async (tx) => {
    const cur = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!cur) throw new HttpError(404, "Order not found.");
    if (cur.status === next) return cur;
    const closed = (s: string) => s === "DELIVERED" || s === "CANCELLED";
    if (!closed(cur.status) && closed(next)) {
      const perItem = new Map<string, number>();
      for (const i of cur.items) perItem.set(i.itemId, (perItem.get(i.itemId) ?? 0) + i.qty);
      for (const [itemId, qty] of perItem) {
        const where = /^\d+$/.test(itemId) ? { productId: Number(itemId) } : itemId.startsWith("oil-") ? { oilId: itemId } : { giftSetId: itemId };
        const inv = await tx.inventoryItem.findFirst({ where });
        if (!inv) continue;
        await tx.inventoryItem.update({
          where: { id: inv.id },
          data: {
            inTransit: Math.max(0, inv.inTransit - qty),
            ...(next === "CANCELLED" ? { stock: inv.stock + qty, ordered: Math.max(0, inv.ordered - qty) } : {}),
          },
        });
      }
    }
    return tx.order.update({ where: { id }, data: { status: next }, include: { items: true } });
  });
  return ok(serializeOrder(order));
});
