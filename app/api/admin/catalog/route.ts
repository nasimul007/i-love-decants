import { z } from "zod";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";
import { catalogOps, getOverrides, mutateCatalog } from "@/lib/server/overrides";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("products");
  return ok(await getOverrides());
});

const num = z.number();
const op = z.discriminatedUnion("op", [
  z.object({ op: z.literal("addVolume"), ml: num, sprays: num, price: num.optional() }),
  z.object({ op: z.literal("removeVolume"), ml: num }),
  z.object({ op: z.literal("resetVolumes") }),
  z.object({ op: z.literal("setSprays"), sprays: z.record(z.string(), num) }),
  z.object({ op: z.literal("setProductPrices"), id: num, prices: z.record(z.string(), num.nullable()), full: num.nullable().optional(), off: z.array(num).max(20).optional() }),
  z.object({ op: z.literal("resetProductPrices"), id: num }),
  z.object({ op: z.literal("setItemPrice"), id: z.string(), price: num }),
  z.object({ op: z.literal("resetItemPrice"), id: z.string() }),
  z.object({ op: z.literal("saveFullBottle"), enabled: z.boolean(), ml: num, sprays: num, price: num.nullable() }),
]);

/** One endpoint for every catalogue-settings mutation; returns the fresh overrides. */
export const POST = route(async (req) => {
  await requireStaff("products");
  const a = await body(req, op);
  const overrides = await mutateCatalog(async (tx) => {
    switch (a.op) {
      case "addVolume": return catalogOps.addVolume(tx, a);
      case "removeVolume": return catalogOps.removeVolume(tx, a.ml);
      case "resetVolumes": return catalogOps.resetVolumes(tx);
      case "setSprays": return catalogOps.setSprays(tx, a.sprays);
      case "setProductPrices": return catalogOps.setProductPrices(tx, a.id, a.prices, a.full, a.off);
      case "resetProductPrices": return catalogOps.resetProductPrices(tx, a.id);
      case "setItemPrice": return catalogOps.setItemPrice(tx, a.id, a.price);
      case "resetItemPrice": return catalogOps.resetItemPrice(tx, a.id);
      case "saveFullBottle": return catalogOps.saveFullBottle(tx, a);
    }
  });
  return ok(overrides);
});
