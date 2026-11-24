import { DEFAULT_FULL_BOTTLE, DEFAULT_SPRAYS, DEFAULT_VOLUMES } from "@/lib/config";
import type { CatalogOverrides, FullBottleSettings, Product } from "@/types";

/**
 * Admin-controlled catalogue settings:
 *   - which volumes are on sale (add / delete volume sections)
 *   - spray count per volume
 *   - each perfume's price per volume (blank = that perfume isn't offered in that volume)
 *   - oil and gift-set prices
 *
 * Stored in this browser (`ild-catalog-overrides-v1`) like the rest of the demo. Backend mapping in HANDOFF.md.
 */
export const EMPTY_OVERRIDES: CatalogOverrides = { prices: {}, itemPrices: {}, sprays: {} };
export const MAX_PRICE = 1_000_000;
export const MAX_SPRAYS = 100_000;
export const MIN_VOLUME = 1;
export const MAX_VOLUME = 1000;
export const MAX_VOLUMES = 12;

export const formatSprays = (n: number) => `${n}+ sprays`;

/** Suggested spray count for a newly added volume (≈15 sprays/ml for small decants, ≈11/ml for full bottles). */
export const suggestSprays = (ml: number) => Math.max(1, Math.round(ml * (ml <= 15 ? 15 : 11)));


/** Full bottle section settings (defaults: OFF, 100 ml, 1100 sprays, no price yet). */
export const fullBottleOf = (o: CatalogOverrides): FullBottleSettings => ({ ...DEFAULT_FULL_BOTTLE, ...(o.fullBottle ?? {}) });

/** True when Full bottle is ON and has a price, i.e. customers can see it. */
export const fullBottleLive = (o: CatalogOverrides): boolean => {
  const fb = fullBottleOf(o);
  return fb.enabled && fb.price !== null;
};

/** The regular section hidden because Full bottle (ON) uses the same ml, if any. */
export const sectionReplacedByFullBottle = (o: CatalogOverrides): number | null => {
  const fb = fullBottleOf(o);
  return fullBottleLive(o) && activeVolumes(o).includes(fb.ml) ? fb.ml : null;
};

/* ───────── Pure helpers (also used by the React hooks) ───────── */

/** Volumes currently on sale, ascending. */
export const activeVolumes = (o: CatalogOverrides): number[] =>
  [...new Set((o.volumes ?? DEFAULT_VOLUMES).filter((v) => Number.isInteger(v) && v > 0))].sort((a, b) => a - b);

/** Price for one perfume/volume after overrides; undefined = not offered. */
function priceFor(p: Product, v: number, o: CatalogOverrides): number | undefined {
  const custom = o.prices[String(p.id)]?.[String(v)];
  if (custom === null) return undefined;
  if (typeof custom === "number") return custom;
  return p.prices[v];
}

/**
 * The perfume as customers see it: only active volumes that have a price, plus the Full bottle option while it is ON.
 * A regular section with the same ml as the Full bottle is left out while Full bottle is ON (same bottle).
 */
export function applyToProduct(p: Product, o: CatalogOverrides): Product {
  const replaced = sectionReplacedByFullBottle(o);
  const prices: Record<number, number> = {};
  for (const v of activeVolumes(o)) {
    if (v === replaced) continue;
    const price = priceFor(p, v, o);
    if (price !== undefined) prices[v] = price;
  }
  const { fullBottle: _base, ...rest } = p;
  const offer = fullBottleFor(p, o);
  return offer ? { ...rest, prices, fullBottle: offer } : { ...rest, prices };
}

/** This perfume's Full bottle price/size/sprays, or undefined if OFF / not offered for it. */
export function fullBottleFor(p: Product, o: CatalogOverrides) {
  if (!fullBottleLive(o)) return undefined;
  const fb = fullBottleOf(o);
  const custom = o.prices[String(p.id)]?.full;
  if (custom === null) return undefined;
  const price = typeof custom === "number" ? custom : fb.price!;
  return { ml: fb.ml, price, sprays: fb.sprays };
}

export const fullBottleDetail = (ml: number, family?: string) => `Full bottle (${ml} ml)${family ? ` · ${family}` : ""}`;

export function effectiveSprays(o: CatalogOverrides): Record<number, number> {
  const out: Record<number, number> = {};
  for (const v of activeVolumes(o)) {
    const n = o.sprays[String(v)] ?? DEFAULT_SPRAYS[v];
    if (n !== undefined) out[v] = n;
  }
  return out;
}
