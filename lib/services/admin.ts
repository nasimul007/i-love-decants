import type { AdminSection, AdminSession } from "@/types";

/** Admin sections (tabs). Authentication and permission checks live on the server; `can` only decides which tabs to show. */
export const ADMIN_SECTIONS: { id: AdminSection; label: string }[] = [
  { id: "inventory", label: "Inventory" },
  { id: "products", label: "Prices & sprays" },
  { id: "customers", label: "Customers" },
  { id: "history", label: "Login history" },
  { id: "coupons", label: "Coupons" },
  { id: "content", label: "Notice, categories & FAQ" },
];

export function can(session: AdminSession | null, section: AdminSection): boolean {
  if (!session) return false;
  return session.role === "owner" || !!session.permissions?.[section];
}
