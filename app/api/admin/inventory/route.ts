import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/server/auth";
import { body, ok, route } from "@/lib/server/http";
import { KIND_FROM_LABEL, serializeInventory } from "@/lib/server/inventory";
import { PRODUCTS } from "@/lib/data/catalog";
import { OIL_ML } from "@/lib/config";
import { loadCatalog } from "@/lib/server/catalog";
import { rangeText } from "@/lib/server/overrides";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireStaff("inventory");
  const [items, shop, all] = await Promise.all([db.inventoryItem.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] }), loadCatalog(), loadCatalog(db, { all: true })]);
  // A perfume's Sizes show what the shop can sell now: sizes bigger than the ml left in stock aren't offered.
  const sizesOf = (c: typeof shop, id: number) => Object.keys(c.products.find((x) => x.id === id)?.prices ?? {}).map(Number).sort((a, b) => a - b);
  return ok(items.map((i) => {
    const r = serializeInventory(i);
    if (i.productId === null || all.products.find((x) => x.id === i.productId)?.fullBottle) return r;
    const every = sizesOf(all, i.productId), now = sizesOf(shop, i.productId);
    if (!every.length) return r; // "Not priced yet"
    const live = i.enabled && i.visible && !i.removed && now.length > 0;
    r.sizes = live && now.length < every.length ? `${rangeText(now)} (stock limits it)` : rangeText(every);
    return r;
  }));
});

const create = z.object({
  name: z.string().trim().min(1).max(62),
  type: z.enum(["Perfume decant", "Perfume oil", "Gift set", "Custom bottle"]),
  sizes: z.string().trim().max(60).default(""),
  price: z.number().int().min(0).max(1_000_000), // ignored for perfumes: they are priced per size in the product editor
  stock: z.number().int().min(0).max(1_000_000), // ml for decants/oils, pieces otherwise
});

/**
 * Adds a stock record AND the storefront item it sells (perfume, oil or gift set), so a new item really appears in the
 * shop and in every admin price/details table. Custom bottles have no shop page: they stay a plain stock record.
 */
export const POST = route(async (req) => {
  await requireStaff("inventory");
  const i = await body(req, create);
  const suffix = Date.now().toString(36);
  const item = await db.$transaction(async (tx) => {
    const link: { productId?: number; oilId?: string; giftSetId?: string } = {};
    if (i.type === "Perfume decant") {
      const id = ((await tx.product.aggregate({ _max: { id: true } }))._max.id ?? 0) + 1;
      const look = PRODUCTS[(id - 1) % PRODUCTS.length]; // borrow a drawn-bottle colour set until photos are uploaded
      const family = (await tx.category.findFirst({ where: { hidden: false }, orderBy: [{ sort: "asc" }, { name: "asc" }] }))?.name ?? "Fresh";
      await tx.product.create({
        data: { id, name: i.name, family, badge: "", notes: "", description: "", top: "", heart: "", base: "", liquid: look.liquid, pale: look.pale, ink: look.ink, shape: look.shape, scentTags: [] },
      });
      link.productId = id;
    } else if (i.type === "Perfume oil") {
      link.oilId = (await tx.oil.create({ data: { id: `oil-${suffix}`, brand: i.name, name: i.name, price: i.price } })).id;
    } else if (i.type === "Gift set") {
      link.giftSetId = (await tx.giftSet.create({ data: { id: `gift-${suffix}`, name: i.name, description: "", price: i.price, accent: "#d6acba" } })).id;
    }
    return tx.inventoryItem.create({
      data: { name: i.name, kind: KIND_FROM_LABEL[i.type], sizes: { "Perfume decant": "Not priced yet", "Perfume oil": `${OIL_ML} ml`, "Gift set": "Set", "Custom bottle": i.sizes }[i.type], price: i.type === "Perfume decant" ? 0 : i.price, stock: i.stock, ...link },
    });
  });
  return ok(serializeInventory(item), 201);
});
