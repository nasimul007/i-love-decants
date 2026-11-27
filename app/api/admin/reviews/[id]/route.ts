import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { refreshReviewPages, reviewPatch } from "@/lib/server/reviews";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("reviews");
  const id = Number((await params).id);
  const { date, ...r } = await body(req, reviewPatch);
  const res = await db.review.updateMany({ where: { id }, data: { ...r, ...(date ? { createdAt: new Date(`${date}T12:00:00`) } : {}) } });
  if (!res.count) throw new HttpError(404, "Review not found.");
  refreshReviewPages();
  return ok({ id });
});

/** Deletes the review and its screenshots. */
export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("reviews");
  const id = Number((await params).id);
  await db.$transaction([db.productImage.deleteMany({ where: { itemId: `review-${id}` } }), db.review.deleteMany({ where: { id } })]);
  refreshReviewPages();
  return ok({ id });
});
