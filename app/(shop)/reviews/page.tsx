import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { ReviewsBrowser } from "@/components/reviews/ReviewsBrowser";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { listReviews, productName, reviewStats } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customer reviews — I Love Decants",
  description: "Real reviews of I Love Decants perfume decants, oils and gift sets from customers across Bangladesh: on our website, WhatsApp and Facebook.",
};

type Props = { searchParams: Promise<{ product?: string; write?: string }> };

// No shop-wide review star markup on purpose: Google shows no stars for a shop's reviews of itself on its own site.
// Product ratings are marked up on the shop page instead (app/(shop)/products/page.tsx).
export default async function ReviewsPage({ searchParams }: Props) {
  const { product: productId = "", write = "" } = await searchParams;
  const name = productId ? await productName(productId).catch(() => null) : null;
  const scope = productId && name ? { id: productId, name } : undefined;
  const reviews = await listReviews("published", scope?.id).catch(() => []);
  const s = reviewStats(scope ? await listReviews("published").catch(() => []) : reviews);
  return (
    <RouteView>
      <PageHero
        eyebrow="Customer reviews"
        title="Kind words, honestly shared."
        lead="What customers say after trying our decants, oils and gift sets: written here on the website, or sent to us on WhatsApp and Facebook."
        noteTitle={s.count ? `${s.average.toFixed(1)} out of 5` : "Be the first."}
        note={s.count ? `From ${s.count} review${s.count === 1 ? "" : "s"}. Reviews from Facebook open the original post.` : "Tried one of our scents? Your review helps the next person choose."}
        orb="rgba(234,210,212,.8)"
        compact
      />
      <section className="section" aria-labelledby="reviewsTitle">
        <div className="container"><SectionHeading eyebrow={scope ? scope.name : "All reviews"} title="From people who tried them." id="reviewsTitle" /></div>
        <ReviewsBrowser
          reviews={reviews}
          product={scope}
          side={
            <div className="review-write" id="write">
              <h2>Write a review</h2>
              <p>Shown here once we have checked it. No links, please.</p>
              <ReviewForm defaultProduct={write || scope?.id || ""} />
            </div>
          }
        />
      </section>
    </RouteView>
  );
}
