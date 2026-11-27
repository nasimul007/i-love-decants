import Link from "next/link";
import { ReviewCard, Stars } from "@/components/reviews/ReviewCard";
import { listReviews, reviewStats } from "@/lib/server/reviews";

/** Home page: three reviews the admin starred (newest first, else the newest published) and a link to all reviews. Hidden until there is one.
 *  The home page stays static; staff review changes re-render it (revalidatePath in the review + photo routes). */
export async function ReviewsStrip() {
  const all = await listReviews("published").catch(() => []);
  if (!all.length) return null;
  const s = reviewStats(all);
  const picks = [...all.filter((r) => r.featured), ...all.filter((r) => !r.featured)].slice(0, 3);
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
