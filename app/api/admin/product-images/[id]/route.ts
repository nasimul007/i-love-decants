import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** Staff (products): re-order a photo. `earlier` / `later` swap places; `first` makes it the main photo. */
export const PATCH = route(async (req, { params }: Ctx) => {
  await requireStaff("products");
  const id = Number((await params).id);
  const { move } = await body(req, z.object({ move: z.enum(["earlier", "later", "first"]) }));
  await db.$transaction(async (tx) => {
    const cur = await tx.productImage.findUnique({ where: { id }, select: { productId: true } });
    if (!cur) throw new HttpError(404, "Photo not found.");
    const all = await tx.productImage.findMany({ where: { productId: cur.productId }, orderBy: [{ sort: "asc" }, { id: "asc" }], select: { id: true } });
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
  return ok({ id });
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  await requireStaff("products");
  await db.productImage.deleteMany({ where: { id: Number((await params).id) } });
  return ok({ ok: true });
});
