import type { Coupon } from "@/types";

/** Seed data for the `Coupon` table (prisma/seed.ts). Coupons themselves live in the database. */
export const DEFAULT_COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, active: true },
  { code: "BLOOM20", type: "percent", value: 20, active: true },
  { code: "FLAT100", type: "flat", value: 100, active: true },
  { code: "FIRST15", type: "percent", value: 15, active: true },
];

export const couponService = {
  /** Display-only estimate for the checkout summary; the server computes the real discount. */
  discount(coupon: Coupon | null | undefined, subtotal: number): number {
    if (!coupon) return 0;
    if (coupon.type === "percent") return Math.round((subtotal * coupon.value) / 100);
    return Math.min(coupon.value, subtotal);
  },
};
