import { db } from "@/lib/db";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Public: the scrolling notice under the navbar. */
export const GET = route(async () => {
  const n = await db.siteNotice.findUnique({ where: { id: 1 } });
  return ok({ enabled: !!n?.enabled && !!n.text.trim(), text: n?.text ?? "" });
});
