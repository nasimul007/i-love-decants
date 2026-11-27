import Link from "next/link";
import { ReviewCard, Stars } from "@/components/reviews/ReviewCard";
import { listReviews, reviewStats } from "@/lib/server/reviews";

/** Home page: only the reviews the admin switched to "On home page" (newest first, up to 6), and a link to all reviews.
 *  Hidden while none is switched on. The average still counts every published review.
 *  The home page stays static; staff review changes re-render it (revalidatePath in the review + photo routes). */
export async function ReviewsStrip() {
  const all = await listReviews("published").catch(() => []);
  const picks = all.filter((r) => r.featured).slice(0, 6);
  if (!picks.length) return null;
  const s = reviewStats(all);
  return (
    <section className="section" aria-labelledby="homeReviewsTitle">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Reviews</span>
            <h2 id="homeReviewsTitle">Loved, then re-ordered.</h2>
          </div>
          <div>
            <p className="review-mini"><Stars n={s.average} /> <strong>{s.average.toFixed(1)}</strong> from {s.count} review{s.count === 1 ? "" : "s"}</p>
            <Link className="btn btn-secondary btn-small" href="/reviews">Read all reviews <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="review-strip">{picks.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
      </div>
    </section>
  );
}
