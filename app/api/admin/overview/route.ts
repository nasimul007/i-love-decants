import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Dashboard summary for any signed-in staff member (counts only, plus the latest few sign-ins). */
export const GET = route(async () => {
  await requireStaff();
  const [live, totalItems, inTransit, orders, shipped, customers, recent] = await Promise.all([
    db.inventoryItem.count({ where: { enabled: true, visible: true, removed: false } }),
    db.inventoryItem.count(),
    db.inventoryItem.aggregate({ _sum: { inTransit: true } }),
    db.order.count(),
    db.order.count({ where: { status: "SHIPPED" } }),
    db.customer.count(),
    db.auditLog.findMany({ orderBy: { ts: "desc" }, take: 5 }),
  ]);
  return ok({
    liveProducts: live, totalItems, inTransit: inTransit._sum.inTransit ?? 0, orders, shipped, customers,
    recentSignIns: recent.map((e) => ({ type: e.actor, user: e.user, action: e.action, ts: e.ts.toISOString() })),
  });
});
