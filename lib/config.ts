/** Easy-edit storefront settings. Replace placeholders with real channels. */
export const CONFIG = {
  brand: "I Love Decants",
  tagline: "Pay less, have more!",
  currency: "৳",
  phone: "+880 1886-166889",
  phoneHref: "+8801886166889",
  location: "Dhaka, Bangladesh",
  whatsapp: "https://wa.me/8801886166889",
  messenger: "https://m.me/61559923042243",
  facebook: "https://www.facebook.com/profile.php?id=61559923042243",
  /** Empty = the footer hides the Instagram icon. Put the real profile link here when there is one. */
  instagram: "",
} as const;

/** Public site address for sitemap/canonical links. Set NEXT_PUBLIC_SITE_URL once a custom domain exists; Vercel's production URL is the fallback. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

/** Default volumes on sale (ml). The admin can add or remove volumes in Admin → Inventory → Sizes on sale. */
export const DEFAULT_VOLUMES: readonly number[] = [3, 6, 9, 15, 50]; // the shop sells up to 50 ml

/** Default spray counts per volume (shown as "45+ sprays"). The admin can override these in Admin → Inventory → Sizes on sale. */
export const DEFAULT_SPRAYS: Readonly<Record<number, number>> = {
  3: 45,
  6: 90,
  9: 135,
  15: 225,
  50: 550,
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

/**
 * Perfume parameters (Level 1). Strength, family, audience and lasting are separate fields, never one "type".
 * Families follow Michael Edwards' wheel (Amber, not "Oriental"), with Fruity kept as its own family by client choice.
 */
export const FAMILIES = ["Fresh", "Floral", "Amber", "Woods", "Fruity"] as const;
export const AUDIENCES = ["Men", "Women", "Unisex"] as const;
export const STRENGTHS = ["EDC", "EDT", "EDP", "Parfum/Extrait", "Attar/oil", "Other"] as const;
/** Wear-time ranges in hours. Admin picks one only after a wear test; blank = untested (never guessed from strength). */
export const LASTING = ["Under 2", "2–4", "4–6", "6–8", "8–10", "10–12", "12+"] as const;
