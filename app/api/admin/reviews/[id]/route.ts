import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { productName, refreshReviewPages, reviewPatch } from "@/lib/server/reviews";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("reviews");
  const id = Number((await params).id);
  const { date, ...r } = await body(req, reviewPatch);
  const cur = await db.review.findUnique({ where: { id }, select: { reply: true, productId: true } });
  if (!cur) throw new HttpError(404, "Review not found.");
  if (r.productId !== undefined && r.productId !== cur.productId) { // re-linked: the label follows the product (an unchanged link keeps any older text label)
    const name = await productName(r.productId);
    if (name === null) throw new HttpError(400, "That product is no longer in the shop.");
    if (r.product === undefined) r.product = name;
  }
  const replyAt = r.reply === undefined || r.reply === cur.reply ? {} : { replyAt: r.reply ? new Date() : null }; // date of the latest reply
  const res = await db.review.updateMany({ where: { id }, data: { ...r, ...replyAt, ...(date ? { createdAt: new Date(`${date}T12:00:00`) } : {}) } });
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
