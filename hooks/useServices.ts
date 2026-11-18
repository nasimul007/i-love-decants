"use client";

import { useEffect, useMemo } from "react";
import { KEYS, useStored } from "@/lib/storage";
import { cartService, cartTotals } from "@/lib/services/cart";
import { DEFAULT_COUPONS } from "@/lib/services/coupons";
import { isEnabled } from "@/lib/services/inventory";
import {
  EMPTY_OVERRIDES, activeVolumes, applyToGift, applyToOil, applyToProduct, currentLinePrice, effectiveSprays,
  fullBottleDetail, fullBottleLive, fullBottleOf, sectionReplacedByFullBottle,
} from "@/lib/services/catalogOverrides";
import { hasAnySize } from "@/lib/volumes";
import { PRODUCTS, GIFTS, OILS } from "@/lib/data/catalog";
import type {
  AdminConfig, AdminSession, CartItem, CatalogOverrides, Coupon, Customer, InventoryRecord, LoginEvent, Order,
} from "@/types";

/** Reactive reads over the service layer. Swap internals for SWR/React Query when an API exists. */

/** Admin price & spray overrides (Admin → Prices & sprays). */
export function useCatalogOverrides(): CatalogOverrides {
  const o = useStored<CatalogOverrides | null>(KEYS.catalogOverrides, null);
  return useMemo(() => ({ ...EMPTY_OVERRIDES, ...(o ?? {}) }), [o]);
}

/** Spray count per volume, after admin overrides. */
export function useSprays() {
  const o = useCatalogOverrides();
  return useMemo(() => effectiveSprays(o), [o]);
}

/** Volumes customers can currently choose (admin-controlled), ascending. Excludes a section replaced by Full bottle. */
export function useVolumes(): number[] {
  const o = useCatalogOverrides();
  return useMemo(() => {
    const replaced = sectionReplacedByFullBottle(o);
    return activeVolumes(o).filter((v) => v !== replaced);
  }, [o]);
}

/** The Full bottle section as customers see it: `null` while OFF. */
export function useFullBottle(): { ml: number; sprays: number } | null {
  const o = useCatalogOverrides();
  return useMemo(() => {
    if (!fullBottleLive(o)) return null;
    const fb = fullBottleOf(o);
    return { ml: fb.ml, sprays: fb.sprays };
  }, [o]);
}

/**
 * Cart lines are re-priced on every read, so a price change by the admin applies to bags already filled.
 * Lines for a volume that is no longer sold are left out (they can't be checked out).
 */
export function useCart() {
  const raw = useStored<CartItem[]>(KEYS.cart, []);
  const overrides = useCatalogOverrides();
  const items = useMemo(
    () => raw.flatMap((i) => {
      const price = currentLinePrice(i, overrides);
      if (price === undefined) return [];
      if (i.full) {
        // keep the label/size in step with the Full bottle section (its ml can change)
        const ml = fullBottleOf(overrides).ml;
        const family = i.detail.split(" · ")[1];
        const detail = fullBottleDetail(ml, family);
        return [price === i.price && i.size === ml && i.detail === detail ? i : { ...i, price, size: ml, detail }];
      }
      return [price === i.price ? i : { ...i, price }];
    }),
    [raw, overrides],
  );
  // Items that can no longer be bought (size removed / hidden, or not sold for that perfume) are removed from the
  // stored bag for good, so they can't silently reappear if that size comes back later.
  useEffect(() => {
    const keep = raw.filter((i) => currentLinePrice(i, overrides) !== undefined);
    if (keep.length !== raw.length) cartService.save(keep);
  }, [raw, overrides]);
  const totals = useMemo(() => cartTotals(items), [items]);
  return { items, ...totals, service: cartService };
}

export function useInventoryRecords(): InventoryRecord[] {
  return useStored<InventoryRecord[]>(KEYS.inventory, []);
}

/** Catalogue filtered by admin inventory overrides (disabled/hidden/archived items disappear), with admin prices applied. */
export function useCatalog() {
  const records = useInventoryRecords();
  const overrides = useCatalogOverrides();
  return useMemo(
    () => ({
      // perfumes with no priced volume on sale are hidden
      products: PRODUCTS.filter((p) => isEnabled(records, p.id)).map((p) => applyToProduct(p, overrides)).filter(hasAnySize),
      gifts: GIFTS.filter((g) => isEnabled(records, g.id)).map((g) => applyToGift(g, overrides)),
      oils: OILS.filter((o) => isEnabled(records, o.id)).map((o) => applyToOil(o, overrides)),
    }),
    [records, overrides],
  );
}

export function useCurrentCustomer(): Customer | null {
  const customers = useStored<Customer[]>(KEYS.customers, []);
  const session = useStored<{ email: string } | null>(KEYS.customerSession, null);
  return useMemo(() => (session ? customers.find((c) => c.email === session.email) ?? null : null), [customers, session]);
}

export const useCustomers = () => useStored<Customer[]>(KEYS.customers, []);
export const useOrders = () => useStored<Order[]>(KEYS.orders, []);
export const useLastOrder = () => useStored<Order | null>(KEYS.lastOrder, null);
export const useLoginHistory = () => useStored<LoginEvent[]>(KEYS.loginHistory, []);
export const useAdminConfig = () => useStored<AdminConfig | null>(KEYS.adminConfig, null);
export const useAdminSession = () => useStored<AdminSession | null>(KEYS.adminSession, null);

export function useCoupons(): Coupon[] {
  const saved = useStored<Coupon[] | null>(KEYS.coupons, null);
  return saved && saved.length ? saved : DEFAULT_COUPONS;
}
