import { z } from "zod";
import { db } from "@/lib/db";
import { body, clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";
import { isPersonName, NAME_ERROR } from "@/lib/validators";

/** A customer writes a review on the website. It waits for staff approval (Admin → Reviews) before it is shown. */
const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(60).refine(isPersonName, NAME_ERROR),
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  text: z.string().trim().min(15, "Please write at least a sentence (15 characters).").max(800),
  product: z.string().trim().max(80).default(""),
  company: z.string().max(0).optional(), // honeypot: people never fill this hidden box, bots do
});

export const POST = route(async (req) => {
  rateLimit(`review:${clientIp(req)}`, 5, 60 * 60_000);
  const r = await body(req, schema);
  if (/https?:\/\/|www\./i.test(r.text)) throw new HttpError(400, "Please leave links out of your review.");
  await db.review.create({ data: { name: r.name, rating: r.rating, text: r.text, product: r.product, source: "website", status: "pending" } });
  return ok({ ok: true }, 201);
});
