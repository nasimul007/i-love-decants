"use client";

import { call, clearCache, mutate, refresh } from "./client";
import type {
  AdminSession, CatalogOverrides, Coupon, InventoryKind, InventoryRecord, ManagerPermissions, Order, PublicManager, ServiceResult,
} from "@/types";

export const ADMIN = {
  me: "/api/admin/me",
  overview: "/api/admin/overview",
  catalog: "/api/admin/catalog",
  inventory: "/api/admin/inventory",
  customers: "/api/admin/customers",
  history: "/api/admin/history",
  coupons: "/api/admin/coupons",
  managers: "/api/admin/managers",
  orders: "/api/orders",
} as const;

export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; pages: number }
/** URL of one page of orders (also the cache key). */
export const ordersUrl = (page = 1, pageSize = 20, status?: string) =>
  `${ADMIN.orders}?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`;

export interface AdminMe { session: AdminSession | null; needsSetup: boolean }

/** Cached staff data must not outlive the staff session. */
const wipe = () => clearCache("/api/admin/", ADMIN.orders);

export const adminApi = {
  async setup(input: { name: string; username: string; password: string; confirm: string }): Promise<ServiceResult<unknown>> {
    if (input.password !== input.confirm) return { ok: false, error: "Passwords do not match." };
    const res = await call<AdminSession>("POST", "/api/admin/setup", { name: input.name, username: input.username, password: input.password });
    if (res.ok) { wipe(); mutate<AdminMe>(ADMIN.me, { session: res.data!, needsSetup: false }); }
    return res;
  },
  async login(username: string, password: string): Promise<ServiceResult<unknown>> {
    const res = await call<AdminSession>("POST", "/api/admin/login", { username, password });
    if (res.ok) { wipe(); mutate<AdminMe>(ADMIN.me, { session: res.data!, needsSetup: false }); }
    return res;
  },
  async logout(): Promise<void> {
    await call("POST", "/api/admin/logout");
    wipe();
    mutate<AdminMe>(ADMIN.me, { session: null, needsSetup: false });
  },

  /* orders */
  async setOrderStatus(id: string, status: Order["status"]): Promise<ServiceResult<unknown>> {
    const res = await call("PATCH", `/api/orders/${id}`, { status });
    await Promise.all([refresh(ADMIN.orders), refresh(ADMIN.inventory), refresh(ADMIN.overview)]);
    return res;
  },

  /* inventory */
  async addInventory(input: { name: string; type: InventoryKind; sizes: string; price: number; stock: number }): Promise<ServiceResult<unknown>> {
    const res = await call<InventoryRecord>("POST", ADMIN.inventory, input);
    await Promise.all([refresh(ADMIN.inventory), refresh(ADMIN.overview)]);
    return res;
  },
  async patchInventory(id: string, patch: { stockDelta?: number; enabled?: boolean; visible?: boolean; removed?: boolean }): Promise<ServiceResult<unknown>> {
    const res = await call<InventoryRecord>("PATCH", `${ADMIN.inventory}/${id}`, patch);
    await Promise.all([refresh(ADMIN.inventory), refresh(ADMIN.overview), refresh("/api/products")]);
    return res;
  },

  /* coupons */
  async addCoupon(input: { code: string; type: Coupon["type"]; value: number }): Promise<ServiceResult<unknown>> {
    const res = await call("POST", ADMIN.coupons, input);
    await refresh(ADMIN.coupons);
    return res;
  },
  async toggleCoupon(code: string, active: boolean): Promise<ServiceResult<unknown>> {
    const res = await call("PATCH", `${ADMIN.coupons}/${encodeURIComponent(code)}`, { active });
    await refresh(ADMIN.coupons);
    return res;
  },
  async removeCoupon(code: string): Promise<ServiceResult<unknown>> {
    const res = await call("DELETE", `${ADMIN.coupons}/${encodeURIComponent(code)}`);
    await refresh(ADMIN.coupons);
    return res;
  },

  /* managers (owner only) */
  async saveManager(input: { editId?: string; name: string; username: string; password: string; permissions: ManagerPermissions }): Promise<ServiceResult<PublicManager>> {
    const { editId, ...rest } = input;
    const res = editId
      ? await call<PublicManager>("PATCH", `${ADMIN.managers}/${editId}`, rest)
      : await call<PublicManager>("POST", ADMIN.managers, rest);
    await refresh(ADMIN.managers);
    return res;
  },
  async removeManager(id: string): Promise<ServiceResult<unknown>> {
    const res = await call("DELETE", `${ADMIN.managers}/${id}`);
    await refresh(ADMIN.managers);
    return res;
  },
};

/** Non-finite numbers (blank inputs) become -1 so the server answers with its normal "enter a whole number" message. */
const n = (x: number) => (Number.isFinite(x) ? x : -1);
const nn = (x: number | null) => (x === null ? null : n(x));

async function catalogOp<T extends { op: string }>(body: T): Promise<ServiceResult<CatalogOverrides>> {
  const res = await call<CatalogOverrides>("POST", ADMIN.catalog, body);
  if (res.ok && res.data) {
    mutate(ADMIN.catalog, res.data);
    void refresh(ADMIN.inventory);  // sizes / "from" price columns are synced server-side
    void refresh("/api/products");  // storefront reflects the change immediately
  }
  return res;
}

/** Same method names as the old local service, now backed by the server (which re-validates everything). */
export const catalogOverridesApi = {
  addVolume: (ml: number, sprays: number, price?: number) => catalogOp({ op: "addVolume", ml: n(ml), sprays: n(sprays), price: price === undefined ? undefined : n(price) }),
  removeVolume: (ml: number) => catalogOp({ op: "removeVolume", ml }),
  resetVolumes: () => catalogOp({ op: "resetVolumes" }),
  setSprays: (sprays: Record<number, number>) => catalogOp({ op: "setSprays", sprays: Object.fromEntries(Object.entries(sprays).map(([k, v]) => [k, n(v)])) }),
  setProductPrices: (id: number, prices: Record<number, number | null>, full?: number | null) =>
    catalogOp({ op: "setProductPrices", id, prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, nn(v)])), full: full === undefined ? undefined : nn(full) }),
  resetProductPrices: (id: number) => catalogOp({ op: "resetProductPrices", id }),
  setItemPrice: (id: string, price: number) => catalogOp({ op: "setItemPrice", id, price: n(price) }),
  resetItemPrice: (id: string) => catalogOp({ op: "resetItemPrice", id }),
  saveFullBottle: (v: { enabled: boolean; ml: number; sprays: number; price: number | null }) =>
    catalogOp({ op: "saveFullBottle", enabled: v.enabled, ml: n(v.ml), sprays: n(v.sprays), price: nn(v.price) }),
};
