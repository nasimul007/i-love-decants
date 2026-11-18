import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { catalogOverridesService, fullBottleDetail } from "./catalogOverrides";
import type { CartItem } from "@/types";

export const cartTotals = (items: CartItem[]) => ({
  count: items.reduce((n, i) => n + i.qty, 0),
  subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
});

export const cartService = {
  list: (): CartItem[] => {
    const saved = readJSON<CartItem[]>(KEYS.cart, []);
    return Array.isArray(saved) ? saved : [];
  },
  save: (items: CartItem[]) => writeJSON(KEYS.cart, items),

  add(item: CartItem): void {
    const items = this.list();
    const existing = items.find((e) => e.key === item.key);
    if (existing) existing.qty += 1;
    else items.push(item);
    this.save(items);
  },
  /** Builds a line for a perfume + volume; returns null if invalid. */
  lineForProduct(id: number, size: number): CartItem | null {
    const p = catalogOverridesService.product(id); // admin price applied
    if (!p || p.prices[size] === undefined) return null;
    return {
      key: `${p.id}-${size}`, id: p.id, name: p.name, detail: `${size} ml · ${p.family}`,
      size, price: p.prices[size], qty: 1, swatch: p.pale,
    };
  },
  /** The "Full bottle" option of a perfume (only while the Full bottle section is ON for it). */
  lineForFullBottle(id: number): CartItem | null {
    const p = catalogOverridesService.product(id);
    if (!p?.fullBottle) return null;
    return {
      key: `${p.id}-full`, id: p.id, name: p.name, detail: fullBottleDetail(p.fullBottle.ml, p.family),
      size: p.fullBottle.ml, full: true, price: p.fullBottle.price, qty: 1, swatch: p.pale,
    };
  },
  lineForGift(id: string): CartItem | null {
    const g = catalogOverridesService.gift(id);
    return g ? { key: g.id, id: g.id, name: g.name, detail: "Ready-to-gift set", price: g.price, qty: 1, swatch: g.accent } : null;
  },
  lineForOil(id: string): CartItem | null {
    const o = catalogOverridesService.oil(id);
    return o ? { key: o.id, id: o.id, name: o.name, detail: "6 ml roll-on oil", price: o.price, qty: 1, swatch: "#e7ded0" } : null;
  },
  setQty(key: string, qty: number): void {
    this.save(this.list().map((i) => (i.key === key ? { ...i, qty } : i)).filter((i) => i.qty > 0));
  },
  remove(key: string): void {
    this.save(this.list().filter((i) => i.key !== key));
  },
  clear(): void {
    this.save([]);
  },
};
