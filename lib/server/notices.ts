import "server-only";
import { db } from "@/lib/db";

export const MAX_NOTICES = 20;

export async function listNotices() {
  const rows = await db.notice.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return rows.map((n) => ({ id: n.id, text: n.text, enabled: n.enabled }));
}
