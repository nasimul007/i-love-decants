import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { HttpError, ok, route } from "@/lib/server/http";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT, sniffImage } from "@/lib/server/images";

/** Staff (products): add one photo to a perfume. multipart/form-data with `productId` and `file`. */
export const POST = route(async (req) => {
  await requireStaff("products");
  const form = await req.formData().catch(() => { throw new HttpError(400, "Invalid upload."); });
  const productId = Number(form.get("productId"));
  const file = form.get("file");
  if (!Number.isInteger(productId) || !(file instanceof File)) throw new HttpError(400, "Choose an image to upload.");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(400, "That image is too large (max 2 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(400, "Only JPG, PNG or WebP images are allowed.");
  if (!(await db.product.findUnique({ where: { id: productId }, select: { id: true } }))) throw new HttpError(404, "Perfume not found.");
  if ((await db.productImage.count({ where: { productId } })) >= MAX_IMAGES_PER_PRODUCT) {
    throw new HttpError(400, `A perfume can have at most ${MAX_IMAGES_PER_PRODUCT} photos.`);
  }
  const max = await db.productImage.aggregate({ where: { productId }, _max: { sort: true } });
  const img = await db.productImage.create({
    data: { productId, mime, data: bytes, size: bytes.length, sort: (max._max.sort ?? 0) + 1 },
    select: { id: true },
  });
  return ok({ id: img.id }, 201);
});
