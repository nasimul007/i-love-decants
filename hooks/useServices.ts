"use client";

import { useEffect, useMemo } from "react";
import { KEYS, useStored } from "@/lib/storage";
import { cartService, cartTotals } from "@/lib/services/cart";
import { EMPTY_OVERRIDES, fullBottleDetail } from "@/lib/services/catalogOverrides";
import { hasAnySize } from "@/lib/volumes";
import { useApi } from "@/lib/api/client";
import { ADMIN, ordersUrl, type AdminMe, type AdminSale, type AdminFaq, type AdminNotice, type Page, type ProductDetails, type PublicCategory } from "@/lib/api/admin";
import { ME, MY_ORDERS } from "@/lib/api/customer";
import type {
  CartItem, CatalogOverrides, Coupon, GiftSet, InventoryRecord, LoginEvent, OilProduct, Order, Product, PublicCustomer, PublicManager, Review,
} from "@/types";

/** Reactive reads over the service layer. Swap internals for SWR/React Query when an API exists. */

/* ───────── Storefront data comes from the API (server applies admin prices, volumes, Full bottle, stock) ───────── */

interface StorefrontCatalog {
  products: Product[];
  gifts: GiftSet[];
  oils: OilProduct[];
  categories: string[];
  volumes: number[];
  sprays: Record<number, number>;
  fullBottle: { ml: number; sprays: number } | null;
}
const EMPTY_CATALOG: StorefrontCatalog = { products: [], gifts: [], oils: [], categories: [], volumes: [], sprays: {}, fullBottle: null };

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

/** Storefront catalogue from the API (disabled/hidden/removed items and unpriced perfumes are already excluded). */
export function useCatalog() {
  const { data } = useStorefront();
  return useMemo(
    () => ({
      products: (data?.products ?? []).filter(hasAnySize),
      gifts: data?.gifts ?? EMPTY_CATALOG.gifts,
      oils: data?.oils ?? EMPTY_CATALOG.oils,
      categories: data?.categories ?? EMPTY_CATALOG.categories,
    }),
    [data],
  );
}

/** The signed-in customer (from the session cookie), or null. */
export function useCurrentCustomer(): PublicCustomer | null {
  return useApi<PublicCustomer | null>(ME).data ?? null;
}

/** Orders of the signed-in customer (nothing is fetched while signed out). */
export function useMyOrders(signedIn: boolean): Order[] {
  return useApi<Order[]>(signedIn ? MY_ORDERS : null).data ?? EMPTY_ORDERS;
}
const EMPTY_ORDERS: Order[] = [];

/* ───────── Admin (staff-only endpoints; all permission checks happen on the server) ───────── */

const EMPTY: never[] = [];
// A cached value of an unexpected shape (e.g. left over from before an API change, kept alive by hot reload) is treated as empty.
const useList = <T,>(url: string): T[] => {
  const data = useApi<T[]>(url).data;
  return Array.isArray(data) ? data : (EMPTY as T[]);
};

/** Staff session + whether first-run owner setup is still needed. `loaded` is false until the first response. */
export function useAdminMe() {
  const { data, loaded } = useApi<AdminMe>(ADMIN.me);
  return { session: data?.session ?? null, needsSetup: data?.needsSetup ?? false, loaded };
}

/** Admin price & spray overrides (Admin → Perfumes & prices). */
export function useCatalogOverrides(): CatalogOverrides {
  const { data } = useApi<CatalogOverrides>(ADMIN.catalog);
  return useMemo(() => ({ ...EMPTY_OVERRIDES, ...(data ?? {}) }), [data]);
}

export interface AdminOverview {
  liveProducts: number; totalItems: number; openOrders: number; orders: number; shipped: number; customers: number;
  recentSignIns: LoginEvent[];
}
export const useAdminOverview = () => useApi<AdminOverview>(ADMIN.overview).data;
export const useInventoryRecords = () => useList<InventoryRecord>(ADMIN.inventory);
export const useCustomers = () => useList<PublicCustomer>(ADMIN.customers);
export const useAdminReviews = () => useList<Review>(ADMIN.reviews);
/** One page of orders for staff (newest first). */
export function useOrders(page = 1, pageSize = 20, status?: string) {
  const { data, loaded } = useApi<Page<Order>>(ordersUrl(page, pageSize, status));
  return { orders: data?.items ?? (EMPTY as Order[]), page: data?.page ?? page, pages: data?.pages ?? 1, total: data?.total ?? 0, loaded };
}
export const useLoginHistory = () => useList<LoginEvent>(ADMIN.history);
export const useCoupons = () => useList<Coupon>(ADMIN.coupons);
export const useSales = () => useList<AdminSale>(ADMIN.sales);
export const useAdminNotices = () => useList<AdminNotice>(ADMIN.notice);
export const useAdminCategories = () => useList<PublicCategory>(ADMIN.categories);
export const useAdminProducts = () => useList<{ id: number; name: string; family: string; featured: boolean }>(ADMIN.products);
export const useProductDetails = () => useList<ProductDetails>(ADMIN.productDetails);
export const useAdminFaqs = () => useList<AdminFaq>(ADMIN.faq);
export const useManagers = () => useList<PublicManager>(ADMIN.managers);

/** Last order, kept locally only so the confirmation page can render after the checkout redirect. */
export const useLastOrder = () => useStored<Order | null>(KEYS.lastOrder, null);
