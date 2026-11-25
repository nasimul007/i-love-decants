"use client";

import { useCatalog } from "@/hooks/useServices";
import { money } from "@/lib/format";
import { priceFrom } from "@/lib/volumes";

/** " from ৳230": the lowest live decant price, so the hero CTA states a concrete value. Empty until the catalogue loads. */
export function FromPrice() {
  const { products } = useCatalog();
  const prices = products.map(priceFrom).filter((p) => p > 0);
  return prices.length ? <> from {money(Math.min(...prices))}</> : null;
}
