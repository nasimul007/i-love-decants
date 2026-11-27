import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { ok, route } from "@/lib/server/http";
import { serializeAudit } from "@/lib/server/serialize";
import { csvResponse } from "@/lib/server/csv";

export const dynamic = "force-dynamic";

/** The latest 200 events; `?format=csv` downloads the full history as a spreadsheet. */
export const GET = route(async (req) => {
  await requireStaff("history");
  const csv = new URL(req.url).searchParams.get("format") === "csv";
  const events = await db.auditLog.findMany({ orderBy: { ts: "desc" }, ...(csv ? {} : { take: 200 }) });
  if (csv) return csvResponse(`login-history-${new Date().toISOString().slice(0, 10)}.csv`, ["Time (UTC)", "Type", "User", "Action"], events.map((e) => [e.ts.toISOString(), e.actor, e.user, e.action]));
  return ok(events.map(serializeAudit));
});
