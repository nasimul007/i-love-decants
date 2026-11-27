"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { useCatalog } from "@/hooks/useServices";
import { money } from "@/lib/format";
import { priceFrom } from "@/lib/volumes";

/** " from ৳230": the lowest live decant price, so the hero CTA states a concrete value. Empty until the catalogue loads. */
export function FromPrice() {
  const { products } = useCatalog();
  const t = useT();
  const prices = products.map(priceFrom).filter((p) => p > 0);
  return prices.length ? <> {t("from {price}", { price: money(Math.min(...prices)) })}</> : null;
}
