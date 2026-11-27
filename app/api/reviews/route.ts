import { z } from "zod";
import { db } from "@/lib/db";
import { currentCustomer } from "@/lib/server/auth";
import { clientIp, HttpError, ok, rateLimit, route } from "@/lib/server/http";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/server/images";
import { listReviews, productName, reviewStats } from "@/lib/server/reviews";
import { isPersonName, NAME_ERROR } from "@/lib/validators";

export const dynamic = "force-dynamic";
const MAX_PHOTOS = 3;

/** Public: published reviews of one product (`?product=7`) for its pop-up, with its rating summary. */
export const GET = route(async (req) => {
  const product = new URL(req.url).searchParams.get("product") ?? "";
  if (!product) throw new HttpError(400, "Choose a product.");
  const list = await listReviews("published", product);
  return ok({ stats: reviewStats(list), reviews: list.slice(0, 20) });
});

/** A customer writes a review on the website (multipart form: fields + up to 3 photos). It waits for staff approval
 *  (Admin → Reviews) before it is shown. Signed-in customers with a delivered order of that item get "Verified buyer". */
const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(60).refine(isPersonName, NAME_ERROR),
  rating: z.coerce.number().int().min(1, "Choose a star rating.").max(5),
  text: z.string().trim().min(15, "Please write at least a sentence (15 characters).").max(800),
  productId: z.string().trim().max(40).default(""),
  company: z.string().max(0, "Please leave the hidden field empty.").optional(), // honeypot: people never fill this hidden box, bots do
});

export const POST = route(async (req) => {
  rateLimit(`review:${clientIp(req)}`, 5, 60 * 60_000);
  const form = await req.formData().catch(() => { throw new HttpError(400, "Could not read the form."); });
  const r = schema.parse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (/https?:\/\/|www\./i.test(r.text)) throw new HttpError(400, "Please leave links out of your review.");
  const label = await productName(r.productId);
  if (label === null) throw new HttpError(400, "Choose a product from the list.");

  const files = form.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) throw new HttpError(400, `Add at most ${MAX_PHOTOS} photos.`);
  const photos: { mime: string; data: Uint8Array<ArrayBuffer> }[] = [];
  for (const f of files) {
    if (f.size > MAX_IMAGE_BYTES) throw new HttpError(400, "One of the photos is too large (max 2 MB).");
    const data = new Uint8Array(await f.arrayBuffer());
    const mime = sniffImage(data);
    if (!mime) throw new HttpError(400, "Photos must be JPG, PNG or WebP.");
    photos.push({ mime, data });
  }

  const customer = await currentCustomer();
  const verified = !!customer && !!await db.order.findFirst({
    where: { customerId: customer.id, status: "DELIVERED", ...(r.productId ? { items: { some: { itemId: r.productId } } } : {}) }, select: { id: true },
  });
  await db.$transaction(async (tx) => {
    const row = await tx.review.create({
      data: { name: r.name, rating: r.rating, text: r.text, productId: r.productId, product: label, source: "website", status: "pending", verified, customerId: customer?.id ?? null },
    });
    for (const [i, p] of photos.entries()) await tx.productImage.create({ data: { itemId: `review-${row.id}`, mime: p.mime, data: p.data, size: p.data.length, sort: i + 1 } });
  });
  return ok({ ok: true, verified }, 201);
});
