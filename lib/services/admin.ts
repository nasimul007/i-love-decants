import type { AdminSection, AdminSession } from "@/types";

/** Admin sections (tabs). Authentication and permission checks live on the server; `can` only decides which tabs to show. */
/** `tab: false` = a permission without its own tab (products: Edit + Sizes inside the Inventory tab). */
export const ADMIN_SECTIONS: { id: AdminSection; label: string; tab?: false }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "products", label: "Edit products, prices & sizes", tab: false },
  { id: "customers", label: "Customers" },
  { id: "history", label: "Login history" },
  { id: "coupons", label: "Discounts" },
  { id: "content", label: "Home page & content" },
];

export function can(session: AdminSession | null, section: AdminSection): boolean {
  if (!session) return false;
  return session.role === "owner" || !!session.permissions?.[section];
}
