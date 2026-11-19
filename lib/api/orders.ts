"use client";

import { KEYS, writeJSON } from "@/lib/storage";
import { call, refresh } from "./client";
import { MY_ORDERS } from "./customer";
import { cartService } from "@/lib/services/cart";
import type { CartItem, Coupon, Order, PaymentMethod, ServiceResult } from "@/types";

const lines = (items: CartItem[]) =>
  items.map((i) => ({ id: i.id, size: i.full ? undefined : i.size, full: i.full || undefined, qty: i.qty }));

export interface PlaceOrderInput {
  customer: { name: string; phone: string };
  delivery: { address: string; city: string; notes: string; charge: number };
  payment: { method: PaymentMethod; provider: string; payerAccount: string; reference: string };
  items: CartItem[];
  couponCode: string | null;
}

export const ordersApi = {
  /** The server reprices everything; the returned order is the source of truth. */
  async place(input: PlaceOrderInput): Promise<ServiceResult<Order>> {
    const res = await call<Order>("POST", "/api/orders", {
      ...input, items: lines(input.items), payment: { ...input.payment, method: input.payment.method.toUpperCase() },
    });
    if (res.ok && res.data) {
      writeJSON(KEYS.lastOrder, res.data); // only so the confirmation page can render after the redirect
      cartService.clear();
      void refresh(MY_ORDERS);
    }
    return res;
  },
  validateCoupon: (code: string, items: CartItem[]) =>
    call<{ code: string; type: Coupon["type"]; value: number; discount: number }>("POST", "/api/coupons/validate", { code, items: lines(items) }),
};
