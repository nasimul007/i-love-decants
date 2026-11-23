import "server-only";
import { OIL_ML } from "@/lib/config";
import type { InventoryKind } from "@/lib/generated/prisma/client";

/** Perfume decants and oils are stocked in millilitres (one pool per perfume); gift sets and custom bottles in pieces. */
export const isMlKind = (kind: InventoryKind): boolean => kind === "PERFUME_DECANT" || kind === "PERFUME_OIL";
export const stockUnit = (kind: InventoryKind): "ml" | "pcs" => (isMlKind(kind) ? "ml" : "pcs");

/** Where the inventory row of a storefront item id ("3", "oil-1", "gift-trio") lives. */
export const inventoryWhere = (itemId: string) =>
  /^\d+$/.test(itemId) ? { productId: Number(itemId) } : itemId.startsWith("oil-") ? { oilId: itemId } : { giftSetId: itemId };

/** Stock used by an order line: ml for decants (size × qty) and oils (6 ml × qty), pieces for everything else. */
export const stockNeeded = (itemId: string, sizeMl: number | null, qty: number): number =>
  /^\d+$/.test(itemId) ? (sizeMl ?? 0) * qty : itemId.startsWith("oil-") ? OIL_ML * qty : qty;

/** Total stock needed per inventory item for a list of order lines. */
export function stockByItem(lines: { itemId: string; sizeMl: number | null; qty: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of lines) out.set(l.itemId, (out.get(l.itemId) ?? 0) + stockNeeded(l.itemId, l.sizeMl, l.qty));
  return out;
}
