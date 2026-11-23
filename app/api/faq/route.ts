import { db } from "@/lib/db";
import { ok, route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Public: the FAQ shown at the bottom of the homepage (enabled entries, in order). */
export const GET = route(async () => {
  const rows = await db.faq.findMany({ where: { enabled: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return ok(rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer })));
});
