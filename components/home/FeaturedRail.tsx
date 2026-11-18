"use client";

import { ProductCard } from "@/components/ui/ProductCard";
import { useCatalog } from "@/hooks/useServices";

export function FeaturedRail() {
  const { products } = useCatalog();
  return (
    <div className="product-rail" aria-label="Featured perfumes">
      {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
