import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { inventoryService } from "./inventory";
import { cartService } from "./cart";
import type { CartItem, Order, PaymentMethod } from "@/types";

export interface PlaceOrderInput {
  customer: Order["customer"];
  delivery: Order["delivery"];
  transaction: Order["transaction"];
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
}

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const orderService = {
  list: (): Order[] => readJSON<Order[]>(KEYS.orders, []),
  last: (): Order | null => readJSON<Order | null>(KEYS.lastOrder, null),

  /** `ILD-XXXX`, unique among stored orders. */
  generateId(): string {
    const taken = new Set(this.list().map((o) => o.id));
    for (let attempt = 0; attempt < 50; attempt++) {
      let suffix = "";
      for (let i = 0; i < 4; i++) suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
      if (!taken.has(`ILD-${suffix}`)) return `ILD-${suffix}`;
    }
    return `ILD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  },

  /** Persists the order, updates inventory counters and empties the cart. */
  place(input: PlaceOrderInput): Order {
    const order: Order = {
      id: this.generateId(),
      ...input,
      grandTotal: Math.max(0, input.subtotal - input.discount) + input.delivery.charge,
      placedAt: new Date().toISOString(),
      status: "received",
    };
    writeJSON(KEYS.orders, [order, ...this.list()].slice(0, 200));
    writeJSON(KEYS.lastOrder, order);
    inventoryService.recordSale(order.items);
    cartService.clear();
    return order;
  },

  /** Admin: move an order through its lifecycle; settles the inventory "in transit" counter. */
  updateStatus(id: string, status: Order["status"]): void {
    const orders = this.list();
    const order = orders.find((o) => o.id === id);
    if (!order || order.status === status) return;
    const wasOpen = order.status !== "delivered" && order.status !== "cancelled";
    const isClosed = status === "delivered" || status === "cancelled";
    if (wasOpen && isClosed) inventoryService.settleTransit(order.items, status === "cancelled");
    writeJSON(KEYS.orders, orders.map((o) => (o.id === id ? { ...o, status } : o)));
    const last = this.last();
    if (last?.id === id) writeJSON(KEYS.lastOrder, { ...last, status });
  },

  forCustomer(email: string, phone: string): Order[] {
    return this.list().filter((o) => o.customer.email === email || (phone && o.customer.phone === phone));
  },
};

export const PAYMENT_ROUTES: Record<
  PaymentMethod,
  { label: string; providerLabel: string; accountLabel: string; accountPlaceholder: string; providers: string[]; offline?: boolean }
> = {
  bank: { label: "Bank transfer", providerLabel: "Choose bank", accountLabel: "Your bank account / number", accountPlaceholder: "Account number used for transfer", providers: ["Bank A", "Bank B", "Bank C"] },
  wallet: { label: "Wallet payment", providerLabel: "Choose wallet", accountLabel: "Your wallet number", accountPlaceholder: "Wallet number used for transfer", providers: ["Wallet A", "Wallet B", "Wallet C"] },
  cod: { label: "Cash on delivery", providerLabel: "", accountLabel: "", accountPlaceholder: "", providers: ["Pay on arrival"], offline: true },
};
