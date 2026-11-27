import Link from "next/link";
import { ReviewCard, Stars } from "@/components/reviews/ReviewCard";
import { listReviews, reviewStats } from "@/lib/server/reviews";
import { getT } from "@/lib/i18n/server";

/** Home page: only the reviews the admin switched to "On home page" (newest first, up to 6), and a link to all reviews.
 *  Hidden while none is switched on. The average still counts every published review.
 *  The home page stays static; staff review changes re-render it (revalidatePath in the review + photo routes). */
export async function ReviewsStrip() {
  const all = await listReviews("published").catch(() => []);
  const picks = all.filter((r) => r.featured).slice(0, 6);
  if (!picks.length) return null;
  const s = reviewStats(all);
  const t = await getT();
  return (
    <section className="section" aria-labelledby="homeReviewsTitle">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("Reviews")}</span>
            <h2 id="homeReviewsTitle">{t("Loved, then re-ordered.")}</h2>
          </div>
          <div>
            <p className="review-mini"><Stars n={s.average} /> <strong>{s.average.toFixed(1)}</strong> {t(s.count === 1 ? "from {n} review" : "from {n} reviews", { n: s.count })}</p>
            <Link className="btn btn-secondary btn-small" href="/reviews">{t("Read all reviews")} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="review-strip">{picks.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
      </div>
    </section>
  );
}
