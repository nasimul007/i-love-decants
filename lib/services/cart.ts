import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { fullBottleDetail } from "./catalogOverrides";
import type { CartItem, GiftSet, OilProduct, Product } from "@/types";

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
  /**
   * Lines are built from the storefront catalogue the customer is looking at (server-priced). They are re-priced from
   * the server on every read (`useCart`) and again at checkout, so the price here is only an initial value.
   */
  lineForProduct(p: Product, size: number): CartItem | null {
    if (p.prices[size] === undefined) return null;
    return {
      key: `${p.id}-${size}`, id: p.id, name: p.name, detail: `${size} ml · ${p.family}`,
      size, price: p.prices[size], qty: 1, swatch: p.pale,
    };
  },
  /** The "Full bottle" option of a perfume (only present while the Full bottle section is ON for it). */
  lineForFullBottle(p: Product): CartItem | null {
    if (!p.fullBottle) return null;
    return {
      key: `${p.id}-full`, id: p.id, name: p.name, detail: fullBottleDetail(p.fullBottle.ml, p.family),
      size: p.fullBottle.ml, full: true, price: p.fullBottle.price, qty: 1, swatch: p.pale,
    };
  },
  lineForGift: (g: GiftSet): CartItem => ({ key: g.id, id: g.id, name: g.name, detail: "Ready-to-gift set", price: g.price, qty: 1, swatch: g.accent }),
  lineForOil: (o: OilProduct): CartItem => ({ key: o.id, id: o.id, name: o.name, detail: "6 ml roll-on oil", price: o.price, qty: 1, swatch: "#e7ded0" }),
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
