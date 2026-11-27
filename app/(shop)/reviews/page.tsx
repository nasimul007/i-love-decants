import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { ReviewsBrowser } from "@/components/reviews/ReviewsBrowser";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Stars } from "@/components/reviews/ReviewCard";
import { listReviews, reviewStats } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customer reviews — I Love Decants",
  description: "Real reviews of I Love Decants perfume decants, oils and gift sets from customers across Bangladesh: on our website, WhatsApp and Facebook.",
};

// No review star markup on purpose: Google shows no stars for a shop's reviews of itself on its own site.
export default async function ReviewsPage() {
  const reviews = await listReviews("published").catch(() => []);
  const s = reviewStats(reviews);
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
        <div className="container reviews-layout">
          <aside className="reviews-side">
            {s.count > 0 && (
              <div className="review-summary">
                <strong className="review-average">{s.average.toFixed(1)}</strong>
                <Stars n={s.average} size="lg" />
                <small>{s.count} review{s.count === 1 ? "" : "s"}</small>
                <ul className="review-bars" aria-label="Ratings breakdown">
                  {s.byStars.map((b) => (
                    <li key={b.stars}><span>{b.stars} ★</span><span className="review-bar"><span style={{ width: `${s.count ? (b.count / s.count) * 100 : 0}%` }} /></span><span>{b.count}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="review-write" id="write">
              <h2>Write a review</h2>
              <p>Shown here once we have checked it. No links, please.</p>
              <ReviewForm />
            </div>
          </aside>
          <div className="reviews-main">
            <SectionHeading eyebrow="All reviews" title="From people who tried them." id="reviewsTitle" />
            {s.count ? <ReviewsBrowser reviews={reviews} /> : <p className="acct-empty">No reviews yet. Be the first to write one.</p>}
          </div>
        </div>
      </section>
    </RouteView>
  );
}
