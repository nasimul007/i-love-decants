import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { GIFTS, OILS, PRODUCTS } from "@/lib/data/catalog";
import { DEFAULT_VOLUMES } from "@/lib/config";
import type { CartItem, CatalogOverrides, InventoryKind, InventoryRecord } from "@/types";

/**
 * Admin inventory overrides. If the dashboard has never been used the list is
 * empty and every catalogue item is available. Once seeded, a disabled /
 * hidden / archived record removes that item from the storefront.
 */
export function isEnabled(records: InventoryRecord[], storefrontId: string | number): boolean {
  const rec = records.find((r) => r.storefrontId !== null && String(r.storefrontId) === String(storefrontId));
  return !rec || (rec.enabled && rec.visible && !rec.removed);
}

export const inventoryService = {
  list: (): InventoryRecord[] => {
    const saved = readJSON<InventoryRecord[]>(KEYS.inventory, []);
    return Array.isArray(saved) ? saved : [];
  },
  save: (records: InventoryRecord[]) => writeJSON(KEYS.inventory, records),

  /** Creates a record for every catalogue item the first time the admin opens inventory. */
  ensureSeeded(): void {
    const existing = this.list();
    if (existing.length) return;
    const base = { ordered: 0, inTransit: 0, enabled: true, visible: true, removed: false };
    // Use any prices the admin already edited in "Prices & sprays" (read directly to avoid a circular import).
    const o = readJSON<CatalogOverrides | null>(KEYS.catalogOverrides, null);
    const vols = (o?.volumes?.length ? o.volumes : DEFAULT_VOLUMES).slice().sort((a, b) => a - b);
    // [volume, price] pairs this perfume is actually offered in
    const offered = (p: (typeof PRODUCTS)[number]) => vols
      .map((v) => { const c = o?.prices?.[String(p.id)]?.[String(v)]; return [v, c === null ? undefined : (c ?? p.prices[v])] as const; })
      .filter((x): x is readonly [number, number] => typeof x[1] === "number");
    const fromPrice = (p: (typeof PRODUCTS)[number]) => { const ps = offered(p).map((x) => x[1]); return ps.length ? Math.min(...ps) : p.prices[3]; };
    const sizesOf = (p: (typeof PRODUCTS)[number]) => {
      const vs = offered(p).map((x) => x[0]);
      return !vs.length ? "—" : vs.length > 1 ? `${vs[0]}–${vs[vs.length - 1]} ml` : `${vs[0]} ml`;
    };
    const item = (id: string, dflt: number) => o?.itemPrices?.[id] ?? dflt;
    const seeded: InventoryRecord[] = [
      ...PRODUCTS.map((p) => ({ ...base, id: `inv-p${p.id}`, storefrontId: String(p.id), name: p.name, type: "Perfume decant" as InventoryKind, sizes: sizesOf(p), price: fromPrice(p), stock: 25 })),
      ...OILS.map((o) => ({ ...base, id: `inv-${o.id}`, storefrontId: o.id, name: o.name, type: "Perfume oil" as InventoryKind, sizes: "6 ml", price: item(o.id, o.price), stock: 40 })),
      ...GIFTS.map((g) => ({ ...base, id: `inv-${g.id}`, storefrontId: g.id, name: g.name, type: "Gift set" as InventoryKind, sizes: "Set", price: item(g.id, g.price), stock: 15 })),
    ];
    this.save(seeded);
  },

  add(input: { name: string; type: InventoryKind; sizes: string; price: number; stock: number }): void {
    const rec: InventoryRecord = {
      id: `inventory-${Date.now()}`, storefrontId: null, name: input.name, type: input.type,
      sizes: input.sizes || "3–100 ml", price: input.price, stock: input.stock,
      ordered: 0, inTransit: 0, enabled: true, visible: true, removed: false,
    };
    this.save([rec, ...this.list()]);
  },

  update(id: string, patch: Partial<InventoryRecord>): void {
    this.save(this.list().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  },

  /** Order delivered/cancelled: clears "in transit"; a cancellation also restocks. */
  settleTransit(items: CartItem[], restock: boolean): void {
    const records = this.list();
    if (!records.length) return;
    this.save(
      records.map((r) => {
        if (r.storefrontId === null) return r;
        const qty = items.filter((i) => String(i.id) === r.storefrontId).reduce((n, i) => n + i.qty, 0);
        if (!qty) return r;
        return {
          ...r,
          inTransit: Math.max(0, r.inTransit - qty),
          stock: restock ? r.stock + qty : r.stock,
          ordered: restock ? Math.max(0, r.ordered - qty) : r.ordered,
        };
      }),
    );
  },

  /** Called when an order is placed: bumps `ordered` and reduces stock. */
  recordSale(items: CartItem[]): void {
    const records = this.list();
    if (!records.length) return;
    const next = records.map((r) => {
      if (r.storefrontId === null) return r;
      const qty = items
        .filter((i) => String(i.id) === r.storefrontId)
        .reduce((n, i) => n + i.qty, 0);
      return qty ? { ...r, ordered: r.ordered + qty, inTransit: r.inTransit + qty, stock: Math.max(0, r.stock - qty) } : r;
    });
    this.save(next);
  },
};
