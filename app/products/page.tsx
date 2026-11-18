import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { ProductsView } from "@/components/products/ProductsView";

export const metadata: Metadata = { title: "Products — I Love Decants" };

export default function ProductsPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="The scent shelf"
        title="Everything in one place."
        lead="Perfume decants, perfume oils, and curated gift sets — browse them all, filter by scent or size, and pick exactly what fits you."
        noteTitle="Start with 3 ml."
        note="Wear it across several days, in your own space, before deciding whether you want more."
        orb="rgba(226,233,225,.72)"
      />
      <section className="section">
        <Suspense fallback={<div className="container"><p className="catalog-count">Loading the scent shelf…</p></div>}>
          <ProductsView />
        </Suspense>
      </section>
    </RouteView>
  );
}
