/** Easy-edit storefront settings. Replace placeholders with real channels. */
export const CONFIG = {
  brand: "I Love Decants",
  tagline: "Pay less, have more!",
  currency: "৳",
  phone: "+880 1XXXXXXXXX",
  phoneHref: "+8801000000000",
  location: "Dhaka, Bangladesh",
  whatsapp: "https://wa.me/8801000000000",
  messenger: "https://m.me/yourpage",
  facebook: "https://facebook.com/yourpage",
  instagram: "https://instagram.com/yourusername",
} as const;

/** Default volumes on sale (ml). The admin can add or remove volumes in Admin → Prices & sprays. */
export const DEFAULT_VOLUMES: readonly number[] = [3, 6, 9, 15, 50, 100];

/** Default spray counts per volume (shown as "45+ sprays"). The admin can override these in Admin → Prices & sprays. */
export const DEFAULT_SPRAYS: Readonly<Record<number, number>> = {
  3: 45,
  6: 90,
  9: 135,
  15: 225,
  50: 550,
  100: 1100,
};

/** Full bottle section defaults (OFF until the admin switches it on and sets a price). */
export const DEFAULT_FULL_BOTTLE = { enabled: false, ml: 100, sprays: 1100, price: null } as const;

/** Delivery charge in ৳: inside Dhaka city vs. everywhere else. The server calculates it from the chosen city. */
export const DELIVERY_CHARGE = { insideDhaka: 80, outsideDhaka: 130 } as const;
export const DHAKA_CITY = "Dhaka";
export const deliveryChargeFor = (city: string): number =>
  city.trim().toLowerCase() === DHAKA_CITY.toLowerCase() ? DELIVERY_CHARGE.insideDhaka : DELIVERY_CHARGE.outsideDhaka;

/** Automatic discount on large orders (applied to the subtotal, before any coupon). */
export const BULK_DISCOUNT = { minSubtotal: 5000, percent: 10 } as const;
export const bulkDiscountFor = (subtotal: number): number =>
  subtotal >= BULK_DISCOUNT.minSubtotal ? Math.round((subtotal * BULK_DISCOUNT.percent) / 100) : 0;

/** A perfume oil is a 6 ml roll-on; selling one uses this much of the oil's ml stock. */
export const OIL_ML = 6;
