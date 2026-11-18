import type { Product } from "@/types";

/** Pure helpers for showing whatever volumes a perfume is currently offered in. */

/** Volumes this perfume is offered in (only those with a price), ascending. */
export const volumesOf = (p: Product): number[] =>
  Object.keys(p.prices).map(Number).filter((v) => Number.isFinite(p.prices[v])).sort((a, b) => a - b);

/** Lowest price across offered volumes and the Full bottle (used for "From ৳…", filters and sorting). */
export const priceFrom = (p: Product): number => {
  const all = [...volumesOf(p).map((v) => p.prices[v]), ...(p.fullBottle ? [p.fullBottle.price] : [])];
  return all.length ? Math.min(...all) : 0;
};

/** True if the perfume can be bought in at least one size. */
export const hasAnySize = (p: Product): boolean => volumesOf(p).length > 0 || !!p.fullBottle;

/** Card label, e.g. "3, 6, 9, 15 & 50 ml · Full bottle". */
export const sizesLabel = (p: Product): string => {
  const ml = formatVolumes(volumesOf(p));
  return p.fullBottle ? (ml ? `${ml} · Full bottle` : "Full bottle") : ml;
};

/** "3, 6, 9, 15, 50 & 100 ml" */
export function formatVolumes(vs: readonly number[]): string {
  if (!vs.length) return "";
  if (vs.length === 1) return `${vs[0]} ml`;
  return `${vs.slice(0, -1).join(", ")} & ${vs[vs.length - 1]} ml`;
}

/** "3 ml to 100 ml" */
export const formatRange = (vs: readonly number[]): string =>
  !vs.length ? "" : vs.length === 1 ? `${vs[0]} ml` : `${vs[0]} ml to ${vs[vs.length - 1]} ml`;
