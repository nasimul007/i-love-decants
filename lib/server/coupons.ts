import "server-only";
import type { Coupon, Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "./http";

type Tx = Prisma.TransactionClient | typeof db;

/**
 * Who may use a code (checked when the code is applied and again when the order is placed).
 *  - once per customer: one use per phone number, and one per account for signed-in customers;
 *  - signed-in customers, every time: no limit per person, but guests must sign in first.
 */
export async function assertCouponAllowed(tx: Tx, c: Coupon, who: { phone?: string; customerId?: string | null }) {
  if (!c.oncePerCustomer) {
    if (!who.customerId) throw new HttpError(401, "Sign in to use this code. It is for signed-in customers.");
    return;
  }
  if (who.phone && await tx.couponRedemption.findUnique({ where: { code_phone: { code: c.code, phone: who.phone } } })) {
    throw new HttpError(409, "This code has already been used with this phone number.");
  }
  if (who.customerId && await tx.order.findFirst({ where: { customerId: who.customerId, couponCode: c.code, status: { not: "CANCELLED" } }, select: { id: true } })) {
    throw new HttpError(409, "You have already used this code on your account.");
  }
}
