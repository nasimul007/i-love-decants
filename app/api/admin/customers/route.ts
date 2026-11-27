import { db } from "@/lib/db";
import { publicCustomer, requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";
import { csvResponse } from "@/lib/server/csv";

export const dynamic = "force-dynamic";

/** Customer list; `?format=csv` downloads every customer as a spreadsheet (with their order count). */
export const GET = route(async (req) => {
  await requireStaff("customers");
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const all = await db.customer.findMany({ orderBy: { joinedAt: "desc" }, include: { _count: { select: { orders: true } } } });
    return csvResponse(`customers-${new Date().toISOString().slice(0, 10)}.csv`, ["Name", "Email", "Phone", "Address", "City", "Orders", "Joined (UTC)", "Last login (UTC)"],
      all.map((c) => [c.name, c.email, c.phone, c.address, c.city, c._count.orders, c.joinedAt.toISOString(), c.lastLogin.toISOString()]));
  }
  const list = await db.customer.findMany({ orderBy: { joinedAt: "desc" }, take: 1000 });
  return ok(list.map((c) => ({ id: c.id, ...publicCustomer(c) })));
});
