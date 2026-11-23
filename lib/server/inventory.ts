import "server-only";
import type { InventoryItem, InventoryKind } from "@/lib/generated/prisma/client";
import type { InventoryRecord } from "@/types";
import { stockUnit } from "./stock";

export const KIND_LABEL: Record<InventoryKind, InventoryRecord["type"]> = {
  PERFUME_DECANT: "Perfume decant", PERFUME_OIL: "Perfume oil", GIFT_SET: "Gift set", CUSTOM_BOTTLE: "Custom bottle",
};
export const KIND_FROM_LABEL: Record<InventoryRecord["type"], InventoryKind> = {
  "Perfume decant": "PERFUME_DECANT", "Perfume oil": "PERFUME_OIL", "Gift set": "GIFT_SET", "Custom bottle": "CUSTOM_BOTTLE",
};

export const serializeInventory = (i: InventoryItem): InventoryRecord => ({
  id: i.id,
  storefrontId: i.productId !== null ? String(i.productId) : i.oilId ?? i.giftSetId ?? null,
  name: i.name, type: KIND_LABEL[i.kind], sizes: i.sizes, price: i.price, stock: i.stock, unit: stockUnit(i.kind),
  ordered: i.ordered, inTransit: i.inTransit, enabled: i.enabled, visible: i.visible, removed: i.removed,
});
