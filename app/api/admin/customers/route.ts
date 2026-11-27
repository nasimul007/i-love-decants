import { db } from "@/lib/db";
import { publicCustomer, requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("customers");
  const list = await db.customer.findMany({ orderBy: { joinedAt: "desc" }, take: 1000 });
  return ok(list.map((c) => ({ id: c.id, ...publicCustomer(c) })));
});
