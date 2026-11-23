import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listFaqs } from "@/lib/server/faq";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  question: z.string().trim().min(1, "Enter the question.").max(200, "Keep the question under 200 characters.").optional(),
  answer: z.string().trim().min(1, "Enter the answer.").max(2000, "Keep the answer under 2000 characters.").optional(),
  enabled: z.boolean().optional(),
  move: z.enum(["up", "down"]).optional(), // swap places with the neighbouring question
});

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("content");
  const id = Number((await params).id);
  const { move, ...data } = await body(req, patch);
  await db.$transaction(async (tx) => {
    const cur = await tx.faq.findUnique({ where: { id } });
    if (!cur) throw new HttpError(404, "Question not found.");
    if (Object.keys(data).length) await tx.faq.update({ where: { id }, data });
    if (move) {
      const all = await tx.faq.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
      const i = all.findIndex((f) => f.id === id);
      const j = move === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < all.length) {
        // Re-number everything so ties can't make the swap a no-op.
        const order = all.map((f) => f.id);
        [order[i], order[j]] = [order[j], order[i]];
        for (const [idx, fid] of order.entries()) await tx.faq.update({ where: { id: fid }, data: { sort: idx + 1 } });
      }
    }
  });
  return ok(await listFaqs());
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("content");
  await db.faq.deleteMany({ where: { id: Number((await params).id) } });
  return ok(await listFaqs());
});
