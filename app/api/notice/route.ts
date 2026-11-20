import { db } from "@/lib/db";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Public: the messages of the scrolling notice bar under the navbar (enabled ones, in order). */
export const GET = route(async () => {
  const rows = await db.notice.findMany({ where: { enabled: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return ok({ items: rows.map((n) => n.text).filter((t) => t.trim()) });
});
