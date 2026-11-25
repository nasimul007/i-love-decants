/**
 * Shared domain types. These double as the contract a backend should honour:
 * every service in `lib/services` reads and writes exactly these shapes.
 */

/** A bottle volume in ml. The list on sale is admin-controlled (Admin → Perfumes & prices). */
export type VolumeMl = number;
export type BottleShape = "arch" | "square" | "tall" | "round";
/** A category name (admin-managed). */
export type ScentFamily = string;

export interface Product {
  id: number;
  name: string;
  family: ScentFamily;
  /** Optional override for display; only verified descriptors per fragrance. */
  scentFamilies?: string[];
  badge: string;
  notes: string;
  description: string;
  top: string;
  heart: string;
  base: string;
  /** Perfume parameters; "" / [] = not set (hidden on the storefront). Allowed values: lib/config.ts. */
  brand?: string;
  audience?: string;
  strength?: string;
  /** Wear-time range in hours, e.g. "8–10". */
  lasting?: string;
  keyNotes?: string[];
  /** Shown in the home page hero slideshow and "Find your easy reach" row. */
  featured?: boolean;
  liquid: string;
  pale: string;
  ink: string;
  shape: BottleShape;
  prices: Record<VolumeMl, number>;
  /** Regular price of each size that is on sale right now (`prices` already holds the sale price). */
  wasPrices?: Record<VolumeMl, number>;
  /** Ids of the uploaded photos (main photo first); served from /api/images/[id]. Empty → the drawn bottle is shown. */
  images?: number[];
  /** Set on the storefront copy of a product when the Full bottle section is ON for it. */
  fullBottle?: FullBottleOffer;
}

export interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Regular price while a sale is on (`price` is the sale price). */
  wasPrice?: number;
  accent: string;
  /** Uploaded photo ids, main first (empty → the drawn gift box). */
  images?: number[];
}

export interface OilProduct {
  id: string;
  brand: string;
  name: string;
  price: number;
  /** Regular price while a sale is on (`price` is the sale price). */
  wasPrice?: number;
  /** Uploaded photo ids, main first. */
  images?: number[];
}

/* ───────────── Cart ───────────── */
export interface CartItem {
  /** Unique line key, e.g. `3-15` (product 3, 15 ml), `gift-trio`, `oil-4`. */
  key: string;
  id: number | string;
  name: string;
  detail: string;
  size?: number;
  /** True for the "Full bottle" option (its ml/price come from the Full bottle section). */
  full?: boolean;
  price: number;
  qty: number;
  swatch: string;
}

/* ───────────── Coupons ───────────── */
export type CouponType = "percent" | "flat";
export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  /** ISO date-time after which the code stops working; null = never. */
  expiresAt?: string | null;
  /** Total uses allowed across all customers; null = unlimited. */
  maxUses?: number | null;
  uses?: number;
}

/* ───────────── Customers ───────────── */
export interface Customer {
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  address: string;
  joinedAt: string;
  lastLogin: string;
}
export type PublicCustomer = Omit<Customer, "passwordHash">;
export interface CustomerSession {
  email: string;
}

/* ───────────── Orders ───────────── */
export type PaymentMethod = "bank" | "wallet" | "cod";
export interface OrderTransaction {
  method: PaymentMethod;
  type: string;
  provider: string;
  payerAccount: string;
  reference: string;
}
export interface Order {
  id: string;
  customer: { name: string; phone: string; email?: string };
  delivery: { address: string; city: string; notes: string; charge: number };
  transaction: OrderTransaction;
  items: CartItem[];
  subtotal: number;
  /** Coupon part of the discount. */
  discount: number;
  /** Automatic discount for large orders. */
  bulkDiscount?: number;
  couponCode: string | null;
  grandTotal: number;
  placedAt: string;
  status: "received" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

/* ───────────── Admin ───────────── */
export type AdminSection = "inventory" | "products" | "customers" | "history" | "coupons" | "content";
export type ManagerPermissions = Record<AdminSection, boolean>;

export interface Manager {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  permissions: ManagerPermissions;
}

/** A manager as returned by the API (never includes the password hash). */
export type PublicManager = Omit<Manager, "passwordHash">;

export interface AdminConfig {
  setup: boolean;
  ownerName: string;
  ownerUsername: string;
  ownerHash: string;
  managers: Manager[];
}

export type AdminRole = "owner" | "manager";
export interface AdminSession {
  role: AdminRole;
  name: string;
  username: string;
  permissions?: ManagerPermissions;
}

export type InventoryKind = "Perfume decant" | "Perfume oil" | "Gift set" | "Custom bottle";
export interface InventoryRecord {
  id: string;
  /** Links the record to a storefront product / gift / oil id (as string). */
  storefrontId: string | null;
  name: string;
  type: InventoryKind;
  sizes: string;
  price: number;
  /** Millilitres for perfume decants and oils; pieces for gift sets and custom bottles. */
  unit: "ml" | "pcs";
  stock: number;
  ordered: number;
  inTransit: number;
  enabled: boolean;
  visible: boolean;
  removed: boolean;
}

export type LoginActor = "customer" | "owner" | "manager";
export interface LoginEvent {
  type: LoginActor;
  user: string;
  action: "login" | "logout";
  ts: string;
}

/* ───────────── Admin price & spray overrides ───────────── */
/** Only values that differ from the catalogue defaults are stored. */
export interface CatalogOverrides {
  /** Volumes on sale, ascending. Absent = the default list (3, 6, 9, 15, 50, 100). */
  volumes?: VolumeMl[];
  /** Perfume prices by product id, then volume. `null` = this perfume does not offer that volume. */
  prices: Record<string, Record<string, number | null>>;
  /** Single-price items (oils, gift sets) by id. */
  itemPrices: Record<string, number>;
  /** Spray count per volume (applies to every perfume). */
  sprays: Record<string, number>;
  /**
   * The special "Full bottle" section. It can't be deleted, only switched ON/OFF.
   * Per-perfume prices live in `prices[pid].full` (`null` = that perfume has no full bottle).
   * While ON, a regular section of the same ml is hidden from customers (they are the same bottle).
   */
  fullBottle?: FullBottleSettings;
  /** Every perfume / oil / gift set in the database (incl. ones added in the admin), so the price tables list them all. */
  items?: {
    products: { id: number; name: string; family: string }[];
    oils: { id: string; name: string; price: number; images: number[] }[];
    gifts: { id: string; name: string; price: number; description: string; accent: string; images: number[] }[];
  };
}

export interface FullBottleSettings {
  enabled: boolean;
  ml: number;
  sprays: number;
  /** Price for every perfume (individual perfumes can override it). `null` until the admin sets one. */
  price: number | null;
}

/** A perfume's full-bottle option as customers see it (only present while Full bottle is ON and priced). */
export interface FullBottleOffer {
  ml: number;
  price: number;
  sprays: number;
}

/* ───────────── Misc ───────────── */
export interface ServiceResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}
