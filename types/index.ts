/**
 * Shared domain types. These double as the contract a backend should honour:
 * every service in `lib/services` reads and writes exactly these shapes.
 */

/** A bottle volume in ml. The list on sale is admin-controlled (Admin → Prices & sprays). */
export type VolumeMl = number;
export type BottleShape = "arch" | "square" | "tall" | "round";
export type ScentFamily =
  | "Floral"
  | "Fresh"
  | "Woody"
  | "Gourmand"
  | "Aromatic"
  | "Warm"
  | "Citrus"
  | "Musky";

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
  liquid: string;
  pale: string;
  ink: string;
  shape: BottleShape;
  prices: Record<VolumeMl, number>;
  /** Set on the storefront copy of a product when the Full bottle section is ON for it. */
  fullBottle?: FullBottleOffer;
}

export interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  accent: string;
}

export interface OilProduct {
  id: string;
  brand: string;
  name: string;
  price: number;
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
  discount: number;
  couponCode: string | null;
  grandTotal: number;
  placedAt: string;
  status: "received" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

/* ───────────── Admin ───────────── */
export type AdminSection = "inventory" | "products" | "customers" | "history" | "coupons";
export type ManagerPermissions = Record<AdminSection, boolean>;

export interface Manager {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  permissions: ManagerPermissions;
}

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
