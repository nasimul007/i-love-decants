import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Dashboard summary for any signed-in staff member (counts only; the latest sign-ins only with the Login history permission). */
export const GET = route(async () => {
  const s = await requireStaff();
  const seesHistory = s.role === "OWNER" || !!(s.permissions as Record<string, boolean> | null)?.history;
  const inShop = { OR: [{ productId: { not: null } }, { oilId: { not: null } }, { giftSetId: { not: null } }] }; // stock-only rows are never "live"
  const [live, totalItems, openOrders, orders, shipped, customers, recent] = await Promise.all([
    db.inventoryItem.count({ where: { enabled: true, visible: true, removed: false, ...inShop } }),
    db.inventoryItem.count(),
    db.order.count({ where: { status: { in: ["RECEIVED", "CONFIRMED", "SHIPPED"] } } }),
    db.order.count(),
    db.order.count({ where: { status: "SHIPPED" } }),
    db.customer.count(),
    seesHistory ? db.auditLog.findMany({ orderBy: { ts: "desc" }, take: 5 }) : [],
  ]);
  return ok({
    liveProducts: live, totalItems, openOrders, orders, shipped, customers,
    recentSignIns: recent.map((e) => ({ type: e.actor, user: e.user, action: e.action, ts: e.ts.toISOString() })),
  });
});
