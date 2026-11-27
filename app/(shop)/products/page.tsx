import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { ProductsView } from "@/components/products/ProductsView";
import { loadCatalog } from "@/lib/server/catalog";
import { productRatings } from "@/lib/server/reviews";
import { SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Shop perfume decants, oils & gift sets — I Love Decants",
  description: "Browse authentic perfume decants from 3 ml, alcohol-free perfume oils and gift sets. Filter by brand, scent family, strength and size. Cash on delivery in Bangladesh.",
};
export const dynamic = "force-dynamic";

/** Products are drawn in the browser, so search engines get them here as structured data (no visual change). */
async function ProductsJsonLd() {
  const [{ products }, ratings] = await Promise.all([loadCatalog().catch(() => ({ products: [] })), productRatings().catch(() => ({} as Awaited<ReturnType<typeof productRatings>>))]);
  // Escape "<" so a product name can never close the script tag.
  const ld = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem", position: i + 1,
      item: {
        "@type": "Product", name: p.name, description: p.description, url: `${SITE_URL}/products?product=${p.id}`,
        ...(p.images?.[0] ? { image: `${SITE_URL}/api/images/${p.images[0]}` } : {}),
        ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
        category: p.family,
        // Product reviews from customers (allowed for rich results, unlike a shop rating itself)
        ...(ratings[String(p.id)] ? { aggregateRating: { "@type": "AggregateRating", ratingValue: ratings[String(p.id)].average, reviewCount: ratings[String(p.id)].count, bestRating: 5, worstRating: 1 } } : {}),
        offers: { "@type": "AggregateOffer", priceCurrency: "BDT", lowPrice: Math.min(...Object.values(p.prices)), highPrice: Math.max(...Object.values(p.prices)), offerCount: Object.keys(p.prices).length, availability: "https://schema.org/InStock" },
      },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />;
}

export default function ProductsPage() {
  return (
    <RouteView>
      <ProductsJsonLd />
      <PageHero
        eyebrow="The scent shelf"
        title="Everything in one place."
        lead="Perfume decants, perfume oils, and curated gift sets. Browse them all, filter by scent or size, and pick exactly what fits you."
        noteTitle="Start with 3 ml."
        note="Wear it across several days, in your own space, before deciding whether you want more."
        orb="rgba(226,233,225,.72)"
        compact
      />
      <section className="section">
        <Suspense fallback={<div className="container"><p className="catalog-count">Loading the scent shelf…</p></div>}>
          <ProductsView />
        </Suspense>
      </section>
    </RouteView>
  );
}
