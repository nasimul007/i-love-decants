import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";
import { serializeAudit } from "@/lib/server/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("history");
  const events = await db.auditLog.findMany({ orderBy: { ts: "desc" }, take: 200 });
  return ok(events.map(serializeAudit));
});
