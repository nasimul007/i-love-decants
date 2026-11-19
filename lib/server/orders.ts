import "server-only";
import type { Order, OrderItem } from "@prisma/client";

/** DB order → the `Order` shape in types/index.ts (what the frontend already consumes). */
export function serializeOrder(o: Order & { items: OrderItem[] }) {
  return {
    id: o.id,
    customer: { name: o.customerName, phone: o.customerPhone, email: o.customerEmail ?? undefined },
    delivery: { address: o.address, city: o.city, notes: o.notes, charge: o.deliveryCharge },
    transaction: {
      method: o.paymentMethod.toLowerCase(), type: o.paymentType, provider: o.provider,
      payerAccount: o.payerAccount, reference: o.reference,
    },
    items: o.items.map((i) => ({
      key: i.lineKey, id: /^\d+$/.test(i.itemId) ? Number(i.itemId) : i.itemId, name: i.name, detail: i.detail,
      size: i.sizeMl ?? undefined, full: i.isFull || undefined, price: i.unitPrice, qty: i.qty, swatch: "",
    })),
    subtotal: o.subtotal, discount: o.discount, couponCode: o.couponCode, grandTotal: o.grandTotal,
    placedAt: o.placedAt.toISOString(), status: o.status.toLowerCase(),
  };
}
