import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Coupon, ServiceResult } from "@/types";

export const DEFAULT_COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, active: true },
  { code: "BLOOM20", type: "percent", value: 20, active: true },
  { code: "FLAT100", type: "flat", value: 100, active: true },
  { code: "FIRST15", type: "percent", value: 15, active: true },
];

export const couponService = {
  /** Seeds defaults the first time coupons are read. */
  list(): Coupon[] {
    const saved = readJSON<Coupon[] | null>(KEYS.coupons, null);
    if (Array.isArray(saved) && saved.length) return saved;
    const seeded = DEFAULT_COUPONS.map((c) => ({ ...c }));
    writeJSON(KEYS.coupons, seeded);
    return seeded;
  },
  save: (list: Coupon[]) => writeJSON(KEYS.coupons, list),

  /** Active coupon lookup (case-insensitive). */
  find(code: string, list?: Coupon[]): Coupon | undefined {
    list = list ?? this.list();
    const upper = code.trim().toUpperCase();
    return list.find((c) => c.code === upper && c.active);
  },

  discount(coupon: Coupon | null | undefined, subtotal: number): number {
    if (!coupon) return 0;
    if (coupon.type === "percent") return Math.round((subtotal * coupon.value) / 100);
    return Math.min(coupon.value, subtotal);
  },

  add(input: { code: string; type: Coupon["type"]; value: number }): ServiceResult {
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,20}$/.test(code)) return { ok: false, error: "Enter a valid code (letters and numbers, 2–20 chars)." };
    if (!input.value || input.value <= 0) return { ok: false, error: "Enter a positive value." };
    if (input.type === "percent" && input.value > 100) return { ok: false, error: "Percent cannot exceed 100." };
    const list = this.list();
    if (list.some((c) => c.code === code)) return { ok: false, error: "That code already exists." };
    this.save([...list, { code, type: input.type, value: input.value, active: true }]);
    return { ok: true };
  },
  toggle(code: string) {
    this.save(this.list().map((c) => (c.code === code ? { ...c, active: !c.active } : c)));
  },
  remove(code: string) {
    this.save(this.list().filter((c) => c.code !== code));
  },
};
