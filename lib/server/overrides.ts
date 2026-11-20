import "server-only";
import { db } from "@/lib/db";
import { DEFAULT_SPRAYS, DEFAULT_VOLUMES } from "@/lib/config";
import { GIFTS, OILS, PRODUCTS } from "@/lib/data/catalog";
import { HttpError } from "./http";
import { loadCatalog } from "./catalog";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { CatalogOverrides } from "@/types";

/**
 * Admin price / volume / spray / Full bottle settings. The DB stores them normalised (VolumeSetting, ProductVariant,
 * FullBottleSetting, Oil/GiftSet.price); `getOverrides` renders them as the "diff from defaults" `CatalogOverrides`
 * shape the admin UI already understands. Validation rules mirror the old client-side service.
 */
type Tx = Prisma.TransactionClient;

export const MAX_PRICE = 1_000_000;
export const MAX_SPRAYS = 100_000;
const MIN_VOLUME = 1, MAX_VOLUME = 1000, MAX_VOLUMES = 12;
const FULL = 0; // volumeMl sentinel for per-perfume Full bottle price overrides

const validPrice = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_PRICE;
const validSprays = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_SPRAYS;
const bad = (msg: string) => new HttpError(400, msg);
const rangeText = (vs: number[]) => (vs.length ? (vs.length === 1 ? `${vs[0]} ml` : `${vs[0]}–${vs[vs.length - 1]} ml`) : "—");
const sameAsDefault = (vs: number[]) => vs.length === DEFAULT_VOLUMES.length && vs.every((v, i) => v === DEFAULT_VOLUMES[i]);

export async function getOverrides(tx: Tx | typeof db = db): Promise<CatalogOverrides> {
  const [vols, fbRow, products, oils, gifts] = await Promise.all([
    tx.volumeSetting.findMany({ where: { onSale: true }, orderBy: { volumeMl: "asc" } }),
    tx.fullBottleSetting.findUnique({ where: { id: 1 } }),
    tx.product.findMany({ include: { variants: true }, orderBy: { id: "asc" } }),
    tx.oil.findMany(), tx.giftSet.findMany(),
  ]);
  const volumes = vols.map((v) => v.volumeMl);
  const sprays: Record<string, number> = {};
  for (const v of vols) if (v.sprays !== DEFAULT_SPRAYS[v.volumeMl]) sprays[String(v.volumeMl)] = v.sprays;

  const prices: CatalogOverrides["prices"] = {};
  for (const p of products) {
    const base = PRODUCTS.find((x) => x.id === p.id);
    const diff: Record<string, number | null> = {};
    for (const v of volumes) {
      const row = p.variants.find((x) => !x.isFull && x.volumeMl === v);
      const cur = row?.active ? row.price : null;
      const dflt = base?.prices[v];
      if (dflt === undefined ? cur !== null : cur !== dflt) diff[String(v)] = cur;
    }
    const full = p.variants.find((x) => x.isFull);
    if (full) diff.full = full.active ? full.price : null;
    if (Object.keys(diff).length) prices[String(p.id)] = diff;
  }
  const itemPrices: Record<string, number> = {};
  for (const o of oils) if (o.price !== OILS.find((x) => x.id === o.id)?.price) itemPrices[o.id] = o.price;
  for (const g of gifts) if (g.price !== GIFTS.find((x) => x.id === g.id)?.price) itemPrices[g.id] = g.price;

  return {
    volumes: sameAsDefault(volumes) ? undefined : volumes, prices, itemPrices, sprays,
    fullBottle: fbRow ? { enabled: fbRow.enabled, ml: fbRow.ml, sprays: fbRow.sprays, price: fbRow.price } : undefined,
  };
}

/** Keeps the Inventory tab's "Sizes" and "From ৳…" columns in step with prices. */
async function syncInventory(tx: Tx) {
  const cat = await loadCatalog(tx, { all: true });
  const items = await tx.inventoryItem.findMany({ where: { OR: [{ productId: { not: null } }, { oilId: { not: null } }, { giftSetId: { not: null } }] } });
  for (const it of items) {
    let price = it.price, sizes = it.sizes;
    if (it.productId !== null) {
      const p = cat.products.find((x) => x.id === it.productId);
      if (!p) continue;
      const vs = Object.keys(p.prices).map(Number).sort((a, b) => a - b);
      const all = [...vs.map((v) => p.prices[v]), ...(p.fullBottle ? [p.fullBottle.price] : [])];
      price = all.length ? Math.min(...all) : it.price;
      sizes = p.fullBottle ? (vs.length ? `${rangeText(vs)} + full bottle` : "Full bottle") : rangeText(vs);
    } else if (it.oilId) price = cat.oils.find((x) => x.id === it.oilId)?.price ?? price;
    else if (it.giftSetId) price = cat.gifts.find((x) => x.id === it.giftSetId)?.price ?? price;
    if (price !== it.price || sizes !== it.sizes) await tx.inventoryItem.update({ where: { id: it.id }, data: { price, sizes } });
  }
}

async function defaultVariants(tx: Tx, volumes: number[], productIds?: number[]) {
  const data = PRODUCTS.filter((p) => !productIds || productIds.includes(p.id))
    .flatMap((p) => volumes.filter((v) => p.prices[v] !== undefined).map((v) => ({ productId: p.id, volumeMl: v, price: p.prices[v] })));
  if (data.length) await tx.productVariant.createMany({ data });
}

export const catalogOps = {
  async addVolume(tx: Tx, a: { ml: number; sprays: number; price?: number }) {
    const vols = (await tx.volumeSetting.findMany({ where: { onSale: true } })).map((v) => v.volumeMl);
    const fb = await tx.fullBottleSetting.findUnique({ where: { id: 1 } });
    if (!Number.isInteger(a.ml) || a.ml < MIN_VOLUME || a.ml > MAX_VOLUME) throw bad(`Enter a whole number of ml between ${MIN_VOLUME} and ${MAX_VOLUME}.`);
    if (vols.includes(a.ml)) throw bad(`${a.ml} ml is already on sale.`);
    if (fb?.enabled && fb.price !== null && fb.ml === a.ml) throw bad(`The Full bottle section is ${a.ml} ml, so a ${a.ml} ml section would be the same bottle. Change the Full bottle size or switch it off first.`);
    if (vols.length >= MAX_VOLUMES) throw bad(`You can offer at most ${MAX_VOLUMES} volumes.`);
    if (!validSprays(a.sprays)) throw bad(`Enter a whole number of sprays (1–${MAX_SPRAYS}).`);
    if (a.price !== undefined && !validPrice(a.price)) throw bad(`Enter a whole-number price (0–${MAX_PRICE}).`);
    await tx.volumeSetting.upsert({ where: { volumeMl: a.ml }, update: { onSale: true, sprays: a.sprays }, create: { volumeMl: a.ml, sprays: a.sprays } });
    if (a.price !== undefined) {
      const ids = (await tx.product.findMany({ select: { id: true } })).map((p) => p.id);
      for (const productId of ids) {
        await tx.productVariant.upsert({
          where: { productId_volumeMl_isFull: { productId, volumeMl: a.ml, isFull: false } },
          update: { price: a.price, active: true }, create: { productId, volumeMl: a.ml, price: a.price },
        });
      }
    }
  },

  async removeVolume(tx: Tx, ml: number) {
    const vols = await tx.volumeSetting.findMany({ where: { onSale: true } });
    if (!vols.some((v) => v.volumeMl === ml)) throw bad(`${ml} ml is not on sale.`);
    if (vols.length <= 1) throw bad("At least one volume must stay on sale.");
    await tx.productVariant.deleteMany({ where: { volumeMl: ml, isFull: false } });
    await tx.volumeSetting.delete({ where: { volumeMl: ml } });
  },

  /** Default volumes, spray counts and perfume prices (Full bottle and oil/gift prices are kept). */
  async resetVolumes(tx: Tx) {
    await tx.volumeSetting.deleteMany();
    await tx.volumeSetting.createMany({ data: DEFAULT_VOLUMES.map((v) => ({ volumeMl: v, sprays: DEFAULT_SPRAYS[v] })) });
    await tx.productVariant.deleteMany();
    await defaultVariants(tx, [...DEFAULT_VOLUMES]);
  },

  async setSprays(tx: Tx, sprays: Record<string, number>) {
    const vols = await tx.volumeSetting.findMany({ where: { onSale: true } });
    for (const v of vols) if (!validSprays(sprays[String(v.volumeMl)])) throw bad(`Enter a whole number of sprays for ${v.volumeMl} ml (1–${MAX_SPRAYS}).`);
    for (const v of vols) await tx.volumeSetting.update({ where: { volumeMl: v.volumeMl }, data: { sprays: sprays[String(v.volumeMl)] } });
  },

  async setProductPrices(tx: Tx, id: number, prices: Record<string, number | null>, full?: number | null) {
    if (!(await tx.product.findUnique({ where: { id } }))) throw new HttpError(404, "Product not found.");
    const vols = (await tx.volumeSetting.findMany({ where: { onSale: true } })).map((v) => v.volumeMl);
    const fb = await tx.fullBottleSetting.findUnique({ where: { id: 1 } });
    for (const v of vols) {
      const val = prices[String(v)];
      if (val !== null && !validPrice(val)) throw bad(`Enter a whole-number price for ${v} ml (0–${MAX_PRICE}), or leave it blank to not offer it.`);
    }
    if (full !== undefined && full !== null && !validPrice(full)) throw bad(`Enter a whole-number Full bottle price (0–${MAX_PRICE}), or leave it blank to not offer it.`);
    const fbLive = !!fb?.enabled && fb.price !== null;
    const replaced = fbLive && vols.includes(fb!.ml) ? fb!.ml : null;
    const existingFull = await tx.productVariant.findFirst({ where: { productId: id, isFull: true } });
    const anyVolume = vols.some((v) => v !== replaced && prices[String(v)] !== null && prices[String(v)] !== undefined);
    const fullNotOffered = existingFull ? !existingFull.active : false;
    const anyFull = fbLive && full !== null && (full !== undefined || !fullNotOffered);
    if (!anyVolume && !anyFull) throw bad("Give at least one size a price (blank everywhere would hide this perfume).");

    for (const v of vols) {
      const val = prices[String(v)];
      const where = { productId_volumeMl_isFull: { productId: id, volumeMl: v, isFull: false } };
      if (val === null || val === undefined) await tx.productVariant.deleteMany({ where: { productId: id, volumeMl: v, isFull: false } });
      else await tx.productVariant.upsert({ where, update: { price: val, active: true }, create: { productId: id, volumeMl: v, price: val } });
    }
    if (full !== undefined) {
      const where = { productId_volumeMl_isFull: { productId: id, volumeMl: FULL, isFull: true } };
      if (full === null) await tx.productVariant.upsert({ where, update: { active: false }, create: { productId: id, volumeMl: FULL, isFull: true, active: false, price: 0 } });
      else if (full === fb?.price) await tx.productVariant.deleteMany({ where: { productId: id, isFull: true } }); // same as section → follow it
      else await tx.productVariant.upsert({ where, update: { price: full, active: true }, create: { productId: id, volumeMl: FULL, isFull: true, price: full } });
    }
  },

  async resetProductPrices(tx: Tx, id: number) {
    const vols = (await tx.volumeSetting.findMany({ where: { onSale: true } })).map((v) => v.volumeMl);
    await tx.productVariant.deleteMany({ where: { productId: id } });
    await defaultVariants(tx, vols, [id]);
  },

  async setItemPrice(tx: Tx, id: string, price: number) {
    if (!validPrice(price)) throw bad(`Enter a whole-number price (0–${MAX_PRICE}).`);
    const oil = await tx.oil.updateMany({ where: { id }, data: { price } });
    if (!oil.count) {
      const gift = await tx.giftSet.updateMany({ where: { id }, data: { price } });
      if (!gift.count) throw new HttpError(404, "Item not found.");
    }
  },
  async resetItemPrice(tx: Tx, id: string) {
    const base = OILS.find((x) => x.id === id) ?? GIFTS.find((x) => x.id === id);
    if (!base) throw new HttpError(404, "Item not found.");
    await this.setItemPrice(tx, id, base.price);
  },

  async saveFullBottle(tx: Tx, a: { enabled: boolean; ml: number; sprays: number; price: number | null }) {
    if (!Number.isInteger(a.ml) || a.ml < MIN_VOLUME || a.ml > MAX_VOLUME) throw bad(`Enter the full bottle size as a whole number of ml (${MIN_VOLUME}–${MAX_VOLUME}).`);
    if (!validSprays(a.sprays)) throw bad(`Enter a whole number of sprays (1–${MAX_SPRAYS}).`);
    if (a.price !== null && !validPrice(a.price)) throw bad(`Enter a whole-number price (0–${MAX_PRICE}).`);
    if (a.enabled && a.price === null) throw bad("Set the full bottle price before switching it ON.");
    const data = { enabled: a.enabled, ml: a.ml, sprays: a.sprays, price: a.price };
    await tx.fullBottleSetting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  },
};

/** Runs a catalogue mutation in a transaction, then re-syncs inventory sizes/prices, and returns fresh overrides. */
export async function mutateCatalog(fn: (tx: Tx) => Promise<void>): Promise<CatalogOverrides> {
  return db.$transaction(async (tx) => {
    await fn(tx);
    await syncInventory(tx);
    return getOverrides(tx);
  });
}
