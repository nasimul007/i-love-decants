import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { itemImages } from "./catalog";
import type { Review } from "@/types";

export const REVIEW_SOURCES = ["website", "whatsapp", "facebook", "instagram", "other"] as const;
export const REVIEW_STATUSES = ["pending", "published", "hidden"] as const;

/** Staff fields. `link` must be a web address, e.g. the Facebook post customers open. */
const fields = {
  name: z.string().trim().min(2, "Enter the customer's name.").max(60),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Enter the review text.").max(1200),
  source: z.enum(REVIEW_SOURCES),
  link: z.string().trim().max(500).refine((l) => !l || /^https:\/\/\S+$/.test(l), "The link must start with https://"),
  product: z.string().trim().max(80),
  status: z.enum(REVIEW_STATUSES),
  featured: z.boolean(),
  date: z.string().date().nullish(), // shown date (e.g. when the WhatsApp message was sent); empty = now
};
export const reviewCreate = z.object({ ...fields, link: fields.link.default(""), product: fields.product.default(""), status: fields.status.default("published"), featured: fields.featured.default(false) });
/** Edits send only what changed; no defaults, so nothing else is reset. */
export const reviewPatch = z.object(fields).partial();

const toReview = (r: Awaited<ReturnType<typeof db.review.findMany>>[number], photos: Record<string, number[]>): Review => ({
  id: r.id, name: r.name, rating: r.rating, text: r.text, source: r.source as Review["source"], link: r.link, product: r.product,
  status: r.status as Review["status"], featured: r.featured, date: r.createdAt.toISOString(), images: photos[`review-${r.id}`] ?? [],
});

/** Reviews newest first; the storefront passes `published` only. */
export async function listReviews(status?: Review["status"]) {
  const [rows, photos] = await Promise.all([
    db.review.findMany({ where: status ? { status } : {}, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 500 }),
    itemImages(),
  ]);
  return rows.map((r) => toReview(r, photos));
}

/** Average and count per star, for the summary on the reviews page. */
export const reviewStats = (list: Review[]) => ({
  count: list.length,
  average: list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : 0,
  byStars: [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: list.filter((r) => r.rating === n).length })),
});

/** The home page is static: re-render it when reviews (or their photos) change so the strip is never stale. */
export const refreshReviewPages = () => revalidatePath("/");
