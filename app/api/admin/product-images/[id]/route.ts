import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { photoOwner } from "@/lib/server/images";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

/** Staff needs the permission of whatever the photo belongs to (product, Custom design gallery, review). */
async function requirePhotoAccess(id: number) {
  const cur = await db.productImage.findUnique({ where: { id }, select: { productId: true, itemId: true } });
  if (!cur) throw new HttpError(404, "Photo not found.");
  const { section } = await photoOwner(cur);
  await requireStaff(section);
  return section;
}

/** Staff: re-order a photo. `earlier` / `later` swap places; `first` makes it the main photo. */
export const PATCH = route(async (req, { params }: Ctx) => {
  const id = Number((await params).id);
  const section = await requirePhotoAccess(id);
  const { move } = await body(req, z.object({ move: z.enum(["earlier", "later", "first"]) }));
  await db.$transaction(async (tx) => {
    const cur = await tx.productImage.findUnique({ where: { id }, select: { productId: true, itemId: true } });
    if (!cur) throw new HttpError(404, "Photo not found.");
    const group = cur.productId !== null ? { productId: cur.productId } : { itemId: cur.itemId };
    const all = await tx.productImage.findMany({ where: group, orderBy: [{ sort: "asc" }, { id: "asc" }], select: { id: true } });
    const order = all.map((i) => i.id);
    const i = order.indexOf(id);
    if (move === "first") { order.splice(i, 1); order.unshift(id); }
    else {
      const j = move === "earlier" ? i - 1 : i + 1;
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const [idx, imgId] of order.entries()) await tx.productImage.update({ where: { id: imgId }, data: { sort: idx + 1 } });
  });
  if (section === "reviews") revalidatePath("/"); // the home page reviews strip is static
  return ok({ id });
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const id = Number((await params).id);
  const section = await requirePhotoAccess(id);
  await db.productImage.deleteMany({ where: { id } });
  if (section === "reviews") revalidatePath("/");
  return ok({ ok: true });
});
