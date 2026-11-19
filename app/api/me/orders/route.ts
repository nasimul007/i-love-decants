import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";
import { serializeOrder } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

/** Orders linked to the signed-in account (not matched by phone number, which anyone could claim). */
export const GET = route(async () => {
  const c = await requireCustomer();
  const orders = await db.order.findMany({ where: { customerId: c.id }, include: { items: true }, orderBy: { placedAt: "desc" } });
  return ok(orders.map(serializeOrder));
});
