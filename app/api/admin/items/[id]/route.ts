import { z } from "zod";
import { requireStaff } from "@/lib/server/auth";
import { body, HttpError, ok, route } from "@/lib/server/http";
import { catalogOps, mutateCatalog } from "@/lib/server/overrides";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(62),
  price: z.number().int().min(0).max(1_000_000),
  description: z.string().trim().max(300).optional(), // gift sets only
});

/** Edit an oil or gift set: name (also its stock record), gift description and price. */
export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff("products");
  const id = (await params).id;
  const d = await body(req, schema);
  return ok(await mutateCatalog(async (tx) => {
    const oil = await tx.oil.updateMany({ where: { id }, data: { name: d.name } });
    if (!oil.count) {
      const gift = await tx.giftSet.updateMany({ where: { id }, data: { name: d.name, ...(d.description !== undefined ? { description: d.description } : {}) } });
      if (!gift.count) throw new HttpError(404, "Item not found.");
    }
    await tx.inventoryItem.updateMany({ where: { OR: [{ oilId: id }, { giftSetId: id }] }, data: { name: d.name } });
    await catalogOps.setItemPrice(tx, id, d.price);
  }));
});
