import "server-only";
import { db } from "@/lib/db";
import { DELIVERY_ZONES } from "@/lib/config";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient | typeof db;

/**
 * Storefront catalogue, honouring admin settings:
 *  - only volumes marked on-sale, and only variants that are active
 *  - Full bottle option while it is ON and priced (per-perfume override via isFull variant)
 *  - a regular section equal to the Full bottle ml is hidden while Full bottle is live
 *  - inventory items that are disabled / hidden / removed are dropped
 */
export async function loadCatalog(tx: Tx = db, opts: { all?: boolean } = {}) {
  const [products, oils, gifts, volumes, fb] = await Promise.all([
    tx.product.findMany({ include: { variants: true, inventory: true }, orderBy: { id: "asc" } }),
    tx.oil.findMany({ include: { inventory: true }, orderBy: { id: "asc" } }),
    tx.giftSet.findMany({ include: { inventory: true }, orderBy: { id: "asc" } }),
    tx.volumeSetting.findMany({ where: { onSale: true }, orderBy: { volumeMl: "asc" } }),
    tx.fullBottleSetting.findUnique({ where: { id: 1 } }),
  ]);
  const live = (i: { enabled: boolean; visible: boolean; removed: boolean } | null) => opts.all || !i || (i.enabled && i.visible && !i.removed);
  const fullLive = !!fb?.enabled && fb.price !== null;
  const replaced = fullLive && volumes.some((v) => v.volumeMl === fb!.ml) ? fb!.ml : null;
  const onSale = new Set(volumes.map((v) => v.volumeMl));

  const outProducts = products.filter((p) => live(p.inventory)).map((p) => {
    const prices: Record<number, number> = {};
    for (const v of p.variants) {
      if (v.isFull || !v.active || !onSale.has(v.volumeMl) || v.volumeMl === replaced) continue;
      prices[v.volumeMl] = v.price;
    }
    const override = p.variants.find((v) => v.isFull);
    const fullOffer = fullLive && !(override && !override.active)
      ? { ml: fb!.ml, price: override?.price ?? fb!.price!, sprays: fb!.sprays }
      : undefined;
    const { variants: _v, inventory: _i, scentTags, ...rest } = p;
    return { ...rest, scentFamilies: scentTags.length ? scentTags : undefined, prices, fullBottle: fullOffer };
  });

  return {
    products: outProducts,
    oils: oils.filter((o) => live(o.inventory)).map(({ inventory: _i, ...o }) => o),
    gifts: gifts.filter((g) => live(g.inventory)).map(({ inventory: _i, ...g }) => g),
    volumes: volumes.map((v) => v.volumeMl).filter((v) => v !== replaced),
    fullBottle: fullLive ? { ml: fb!.ml, sprays: fb!.sprays } : null,
    sprays: Object.fromEntries(volumes.filter((v) => v.volumeMl !== replaced).map((v) => [v.volumeMl, v.sprays])),
  };
}

export type RequestedLine = { id: string | number; size?: number; full?: boolean; qty: number };
export interface PricedLine {
  itemId: string; lineKey: string; name: string; detail: string;
  sizeMl: number | null; isFull: boolean; unitPrice: number; qty: number;
}

/** Resolves a requested cart line to its authoritative price/name. Returns null if it can't be bought. */
export function priceLine(cat: Awaited<ReturnType<typeof loadCatalog>>, line: RequestedLine): PricedLine | null {
  const id = String(line.id);
  const p = cat.products.find((x) => String(x.id) === id);
  if (p) {
    if (line.full) {
      if (!p.fullBottle) return null;
      return {
        itemId: id, lineKey: `${id}-full`, name: p.name, detail: `Full bottle (${p.fullBottle.ml} ml) · ${p.family}`,
        sizeMl: p.fullBottle.ml, isFull: true, unitPrice: p.fullBottle.price, qty: line.qty,
      };
    }
    const price = line.size !== undefined ? p.prices[line.size] : undefined;
    if (price === undefined) return null;
    return {
      itemId: id, lineKey: `${id}-${line.size}`, name: p.name, detail: `${line.size} ml · ${p.family}`,
      sizeMl: line.size!, isFull: false, unitPrice: price, qty: line.qty,
    };
  }
  const oil = cat.oils.find((x) => x.id === id);
  if (oil) return { itemId: id, lineKey: id, name: oil.name, detail: "6 ml roll-on oil", sizeMl: null, isFull: false, unitPrice: oil.price, qty: line.qty };
  const gift = cat.gifts.find((x) => x.id === id);
  if (gift) return { itemId: id, lineKey: id, name: gift.name, detail: "Ready-to-gift set", sizeMl: null, isFull: false, unitPrice: gift.price, qty: line.qty };
  return null;
}

export const deliveryCharge = (v: number) => DELIVERY_ZONES.find((z) => z.value === v)?.value ?? null;

export function couponDiscount(c: { type: "PERCENT" | "FLAT"; value: number }, subtotal: number) {
  return c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
}
