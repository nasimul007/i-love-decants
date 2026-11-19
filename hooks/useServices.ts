"use client";

import { useEffect, useMemo } from "react";
import { KEYS, useStored } from "@/lib/storage";
import { cartService, cartTotals } from "@/lib/services/cart";
import { DEFAULT_COUPONS } from "@/lib/services/coupons";
import { EMPTY_OVERRIDES, fullBottleDetail } from "@/lib/services/catalogOverrides";
import { hasAnySize } from "@/lib/volumes";
import { useApi } from "@/lib/api/client";
import { ME, MY_ORDERS } from "@/lib/api/customer";
import type {
  AdminConfig, AdminSession, CartItem, CatalogOverrides, Coupon, Customer, GiftSet, InventoryRecord, LoginEvent, OilProduct, Order, Product, PublicCustomer,
} from "@/types";

/** Reactive reads over the service layer. Swap internals for SWR/React Query when an API exists. */

/** Admin price & spray overrides (Admin → Prices & sprays). */
export function useCatalogOverrides(): CatalogOverrides {
  const o = useStored<CatalogOverrides | null>(KEYS.catalogOverrides, null);
  return useMemo(() => ({ ...EMPTY_OVERRIDES, ...(o ?? {}) }), [o]);
}

/* ───────── Storefront data comes from the API (server applies admin prices, volumes, Full bottle, stock) ───────── */

interface StorefrontCatalog {
  products: Product[];
  gifts: GiftSet[];
  oils: OilProduct[];
  volumes: number[];
  sprays: Record<number, number>;
  fullBottle: { ml: number; sprays: number } | null;
}
const EMPTY_CATALOG: StorefrontCatalog = { products: [], gifts: [], oils: [], volumes: [], sprays: {}, fullBottle: null };

function useStorefront() {
  return useApi<StorefrontCatalog>("/api/products");
}

/** Spray count per volume. */
export function useSprays() {
  return useStorefront().data?.sprays ?? EMPTY_CATALOG.sprays;
}

/** Volumes customers can currently choose, ascending. */
export function useVolumes(): number[] {
  return useStorefront().data?.volumes ?? EMPTY_CATALOG.volumes;
}

/** The Full bottle section as customers see it: `null` while OFF. */
export function useFullBottle(): { ml: number; sprays: number } | null {
  return useStorefront().data?.fullBottle ?? null;
}

/** Server-side price for a cart line, or undefined when it can no longer be bought. */
function livePrice(i: CartItem, cat: StorefrontCatalog): { price: number; size?: number; detail?: string } | undefined {
  if (typeof i.id === "number") {
    const p = cat.products.find((x) => x.id === i.id);
    if (!p) return undefined;
    if (i.full) return p.fullBottle ? { price: p.fullBottle.price, size: p.fullBottle.ml, detail: fullBottleDetail(p.fullBottle.ml, p.family) } : undefined;
    const price = i.size !== undefined ? p.prices[i.size] : undefined;
    return price === undefined ? undefined : { price };
  }
  const oil = cat.oils.find((x) => x.id === i.id);
  if (oil) return { price: oil.price };
  const gift = cat.gifts.find((x) => x.id === i.id);
  return gift ? { price: gift.price } : undefined;
}

/**
 * Cart lines are re-priced on every read from the server catalogue (display only; the server re-checks at checkout).
 * Lines that can no longer be bought are dropped once the catalogue has loaded.
 */
export function useCart() {
  const raw = useStored<CartItem[]>(KEYS.cart, []);
  const { data: cat, loaded } = useStorefront();
  const items = useMemo(() => {
    if (!loaded || !cat) return raw;
    return raw.flatMap((i) => {
      const live = livePrice(i, cat);
      if (!live) return [];
      const next = { ...i, price: live.price, ...(live.size ? { size: live.size } : {}), ...(live.detail ? { detail: live.detail } : {}) };
      return [JSON.stringify(next) === JSON.stringify(i) ? i : next];
    });
  }, [raw, cat, loaded]);
  useEffect(() => {
    if (!loaded || !cat) return;
    const keep = raw.filter((i) => livePrice(i, cat));
    if (keep.length !== raw.length) cartService.save(keep);
  }, [raw, cat, loaded]);
  const totals = useMemo(() => cartTotals(items), [items]);
  return { items, ...totals, service: cartService };
}

export function useInventoryRecords(): InventoryRecord[] {
  return useStored<InventoryRecord[]>(KEYS.inventory, []);
}

/** Storefront catalogue from the API (disabled/hidden/removed items and unpriced perfumes are already excluded). */
export function useCatalog() {
  const { data } = useStorefront();
  return useMemo(
    () => ({
      products: (data?.products ?? []).filter(hasAnySize),
      gifts: data?.gifts ?? EMPTY_CATALOG.gifts,
      oils: data?.oils ?? EMPTY_CATALOG.oils,
    }),
    [data],
  );
}

/** The signed-in customer (from the session cookie), or null. */
export function useCurrentCustomer(): PublicCustomer | null {
  return useApi<PublicCustomer | null>(ME).data ?? null;
}

/** Orders of the signed-in customer. */
export function useMyOrders(): Order[] {
  return useApi<Order[]>(MY_ORDERS).data ?? EMPTY_ORDERS;
}
const EMPTY_ORDERS: Order[] = [];

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
