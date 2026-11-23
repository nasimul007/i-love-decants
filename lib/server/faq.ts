import "server-only";
import { db } from "@/lib/db";

export const MAX_FAQS = 50;

export async function listFaqs() {
  const rows = await db.faq.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer, enabled: f.enabled }));
}
