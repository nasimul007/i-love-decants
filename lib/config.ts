/** Easy-edit storefront settings. Replace placeholders with real channels. */
export const CONFIG = {
  brand: "I Love Decants",
  tagline: "Pay less, have more!",
  currency: "৳",
  phone: "+880 1XXXXXXXXX",
  phoneHref: "+8801000000000",
  location: "Dhaka, Bangladesh",
  whatsapp: "https://wa.me/8801000000000",
  telegram: "https://t.me/yourusername",
  messenger: "https://m.me/yourpage",
  facebook: "https://facebook.com/yourpage",
  tiktok: "https://tiktok.com/@yourusername",
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

/** Delivery zones (value is the charge in ৳). */
export const DELIVERY_ZONES = [
  { value: 100, label: "Inside Dhaka · ৳100" },
  { value: 150, label: "Outside Dhaka · ৳150" },
] as const;
