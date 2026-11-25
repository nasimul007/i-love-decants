import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { HttpError, ok, route } from "@/lib/server/http";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT, sniffImage } from "@/lib/server/images";

/** Staff (products): add one photo to a perfume (`productId`) or an oil / gift set (`itemId`). multipart/form-data with `file`. */
export const POST = route(async (req) => {
  await requireStaff("products");
  const form = await req.formData().catch(() => { throw new HttpError(400, "Invalid upload."); });
  const productId = form.get("productId") ? Number(form.get("productId")) : null;
  const itemId = productId === null ? String(form.get("itemId") ?? "") : null;
  const file = form.get("file");
  if ((productId === null ? !itemId : !Number.isInteger(productId)) || !(file instanceof File)) throw new HttpError(400, "Choose an image to upload.");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(400, "That image is too large (max 2 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(400, "Only JPG, PNG or WebP images are allowed.");
  const exists = productId !== null
    ? await db.product.findUnique({ where: { id: productId }, select: { id: true } })
    : (await db.oil.findUnique({ where: { id: itemId! }, select: { id: true } })) ?? (await db.giftSet.findUnique({ where: { id: itemId! }, select: { id: true } }));
  if (!exists) throw new HttpError(404, "Product not found.");
  const owner = productId !== null ? { productId } : { itemId };
  if ((await db.productImage.count({ where: owner })) >= MAX_IMAGES_PER_PRODUCT) {
    throw new HttpError(400, `A product can have at most ${MAX_IMAGES_PER_PRODUCT} photos.`);
  }
  const max = await db.productImage.aggregate({ where: owner, _max: { sort: true } });
  const img = await db.productImage.create({
    data: { ...owner, mime, data: bytes, size: bytes.length, sort: (max._max.sort ?? 0) + 1 },
    select: { id: true },
  });
  return ok({ id: img.id }, 201);
});
