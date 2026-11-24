/** Sales on products, scent families or product types. Pure helpers shared by the server (pricing) and the admin (labels). */

export type SaleType = "PERCENT" | "FLAT";
export interface SaleRule { target: string; type: SaleType; value: number }

/** Sale targets a price can match, most specific first. */
export const saleKeys = {
  perfume: (id: number, family: string) => [`product:${id}`, `family:${family.trim().toLowerCase()}`, "type:perfume"],
  oil: (id: string) => [`product:${id}`, "type:oil"],
  gift: (id: string) => [`product:${id}`, "type:gift"],
};

/** Price after one sale: % off rounded to whole taka, or a flat amount off; never below 0. */
export const applySale = (price: number, s: Pick<SaleRule, "type" | "value">) =>
  Math.max(0, s.type === "PERCENT" ? price - Math.round((price * s.value) / 100) : price - s.value);

/** The lowest price any matching sale gives (sales never stack), or the price itself when none match. */
export function salePrice(price: number, keys: string[], sales: SaleRule[]): number {
  return sales.filter((s) => keys.includes(s.target)).reduce((best, s) => Math.min(best, applySale(price, s)), price);
}
