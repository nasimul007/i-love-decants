"use client";

import { ProductCard } from "@/components/ui/ProductCard";
import { useCatalog } from "@/hooks/useServices";

export function FeaturedRail() {
  const { products } = useCatalog();
  const picked = products.filter((p) => p.featured); // chosen in Admin → Home page & content
  return (
    <div className="product-rail" aria-label="Featured perfumes">
      {(picked.length ? picked : products).slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
