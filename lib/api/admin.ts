"use client";

import { call, clearCache, mutate, refresh, refreshPrefix } from "./client";
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
  notice: "/api/admin/notice",
  categories: "/api/admin/categories",
  products: "/api/admin/products",
  productDetails: "/api/admin/product-details",
  faq: "/api/admin/faq",
} as const;

export interface Page<T> { items: T[]; page: number; pageSize: number; total: number; pages: number }
/** URL of one page of orders (also the cache key). */
export const ordersUrl = (page = 1, pageSize = 20, status?: string) =>
  `${ADMIN.orders}?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`;

export interface AdminNotice { id: number; text: string; enabled: boolean }
export interface PublicCategory { id: number; name: string; hidden: boolean; products: number }
export interface AdminFaq { id: number; question: string; answer: string; enabled: boolean }
export interface PublicFaq { id: number; question: string; answer: string }
export interface ProductDetails { id: number; name: string; family: string; description: string; top: string; heart: string; base: string; images: number[] }
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
    await Promise.all([refreshPrefix(ADMIN.orders), refresh(ADMIN.inventory), refresh(ADMIN.overview)]);
    return res;
  },

  /* inventory */
  async addInventory(input: { name: string; type: InventoryKind; sizes: string; price: number; stock: number }): Promise<ServiceResult<unknown>> {
    const res = await call<InventoryRecord>("POST", ADMIN.inventory, input);
    await Promise.all([refresh(ADMIN.inventory), refresh(ADMIN.overview)]);
    return res;
  },
  async patchInventory(id: string, patch: { stockDelta?: number; stockSet?: number; enabled?: boolean; visible?: boolean; removed?: boolean }): Promise<ServiceResult<unknown>> {
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

  /* notice & categories */
  async noticeOp(op: () => Promise<ServiceResult<AdminNotice[]>>): Promise<ServiceResult<unknown>> {
    const res = await op();
    if (res.ok) mutate(ADMIN.notice, res.data);
    void refresh("/api/notice"); // storefront bar updates right away
    return res;
  },
  addNotice(text: string) { return this.noticeOp(() => call<AdminNotice[]>("POST", ADMIN.notice, { text })); },
  editNotice(id: number, text: string) { return this.noticeOp(() => call<AdminNotice[]>("PATCH", `${ADMIN.notice}/${id}`, { text })); },
  setNoticeEnabled(id: number, enabled: boolean) { return this.noticeOp(() => call<AdminNotice[]>("PATCH", `${ADMIN.notice}/${id}`, { enabled })); },
  removeNotice(id: number) { return this.noticeOp(() => call<AdminNotice[]>("DELETE", `${ADMIN.notice}/${id}`)); },
  async categoryOp(op: () => Promise<ServiceResult<PublicCategory[]>>): Promise<ServiceResult<unknown>> {
    const res = await op();
    if (res.ok) mutate(ADMIN.categories, res.data);
    await Promise.all([refresh(ADMIN.products), refresh("/api/products")]);
    return res;
  },
  addCategory(name: string) { return this.categoryOp(() => call<PublicCategory[]>("POST", ADMIN.categories, { name })); },
  renameCategory(id: number, name: string) { return this.categoryOp(() => call<PublicCategory[]>("PATCH", `${ADMIN.categories}/${id}`, { name })); },
  setCategoryHidden(id: number, hidden: boolean) { return this.categoryOp(() => call<PublicCategory[]>("PATCH", `${ADMIN.categories}/${id}`, { hidden })); },
  removeCategory(id: number) { return this.categoryOp(() => call<PublicCategory[]>("DELETE", `${ADMIN.categories}/${id}`)); },
  async assignCategory(productId: number, category: string): Promise<ServiceResult<unknown>> {
    const res = await call("PATCH", `${ADMIN.products}/${productId}`, { category });
    await Promise.all([refresh(ADMIN.products), refresh(ADMIN.categories), refresh("/api/products")]);
    return res;
  },

  /* product photos */
  async uploadProductImage(productId: number, file: Blob): Promise<ServiceResult<{ id: number }>> {
    const form = new FormData();
    form.set("productId", String(productId));
    form.set("file", file, "photo.webp");
    try {
      const res = await fetch("/api/admin/product-images", { method: "POST", body: form, credentials: "same-origin" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: (json as { error?: string }).error ?? "Upload failed." };
      return { ok: true, data: json as { id: number } };
    } catch { return { ok: false, error: "Network error. Please try again." }; }
  },
  async moveProductImage(id: number, move: "earlier" | "later" | "first"): Promise<ServiceResult<unknown>> {
    const res = await call("PATCH", `/api/admin/product-images/${id}`, { move });
    await this.photosChanged();
    return res;
  },
  async removeProductImage(id: number): Promise<ServiceResult<unknown>> {
    const res = await call("DELETE", `/api/admin/product-images/${id}`);
    await this.photosChanged();
    return res;
  },
  async photosChanged() { await Promise.all([refresh(ADMIN.productDetails), refresh("/api/products")]); },

  /* FAQ */
  async faqOp(op: () => Promise<ServiceResult<AdminFaq[]>>): Promise<ServiceResult<unknown>> {
    const res = await op();
    if (res.ok) mutate(ADMIN.faq, res.data);
    void refresh("/api/faq"); // the homepage section updates right away
    return res;
  },
  addFaq(question: string, answer: string) { return this.faqOp(() => call<AdminFaq[]>("POST", ADMIN.faq, { question, answer })); },
  editFaq(id: number, patch: { question?: string; answer?: string; enabled?: boolean; move?: "up" | "down" }) {
    return this.faqOp(() => call<AdminFaq[]>("PATCH", `${ADMIN.faq}/${id}`, patch));
  },
  removeFaq(id: number) { return this.faqOp(() => call<AdminFaq[]>("DELETE", `${ADMIN.faq}/${id}`)); },

  /* product text */
  async saveProductDetails(id: number, d: Pick<ProductDetails, "description" | "top" | "heart" | "base">): Promise<ServiceResult<unknown>> {
    const res = await call("PATCH", `${ADMIN.productDetails}/${id}`, d);
    await Promise.all([refresh(ADMIN.productDetails), refresh("/api/products")]);
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
