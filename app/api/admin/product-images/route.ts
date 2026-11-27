import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/server/auth";
import { HttpError, ok, route } from "@/lib/server/http";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT, photoOwner, sniffImage } from "@/lib/server/images";

/** Staff: add one photo to a perfume (`productId`), an oil / gift set, the Custom design gallery or a review (`itemId`). multipart/form-data with `file`. */
export const POST = route(async (req) => {
  await requireStaff();
  const form = await req.formData().catch(() => { throw new HttpError(400, "Invalid upload."); });
  const productId = form.get("productId") ? Number(form.get("productId")) : null;
  const itemId = productId === null ? String(form.get("itemId") ?? "") : null;
  const file = form.get("file");
  if ((productId === null ? !itemId : !Number.isInteger(productId)) || !(file instanceof File)) throw new HttpError(400, "Choose an image to upload.");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(400, "That image is too large (max 2 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(400, "Only JPG, PNG or WebP images are allowed.");
  const { section, exists } = await photoOwner({ productId, itemId });
  await requireStaff(section);
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
  if (section === "reviews") revalidatePath("/"); // the home page reviews strip is static
  return ok({ id: img.id }, 201);
});
