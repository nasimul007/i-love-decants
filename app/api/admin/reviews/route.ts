import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";
import { listReviews, refreshReviewPages, reviewCreate } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("reviews");
  return ok(await listReviews());
});

/** Staff adds a review (from WhatsApp, Facebook, Instagram, in person…). Published right away unless they choose otherwise. */
export const POST = route(async (req) => {
  await requireStaff("reviews");
  const { date, ...r } = await body(req, reviewCreate);
  const row = await db.review.create({ data: { ...r, ...(date ? { createdAt: new Date(`${date}T12:00:00`) } : {}) } });
  refreshReviewPages();
  return ok({ id: row.id }, 201);
});
