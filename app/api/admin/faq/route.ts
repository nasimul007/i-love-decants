import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { listFaqs, MAX_FAQS } from "@/lib/server/faq";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("content");
  return ok(await listFaqs());
});

const faqFields = {
  question: z.string().trim().min(1, "Enter the question.").max(200, "Keep the question under 200 characters."),
  answer: z.string().trim().min(1, "Enter the answer.").max(2000, "Keep the answer under 2000 characters."),
};

export const POST = route(async (req) => {
  await requireStaff("content");
  const d = await body(req, z.object({ ...faqFields, enabled: z.boolean().default(true) }));
  if ((await db.faq.count()) >= MAX_FAQS) throw new HttpError(400, `You can keep at most ${MAX_FAQS} questions.`);
  const max = await db.faq.aggregate({ _max: { sort: true } });
  await db.faq.create({ data: { ...d, sort: (max._max.sort ?? 0) + 1 } });
  return ok(await listFaqs(), 201);
});
