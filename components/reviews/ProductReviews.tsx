"use client";

import Link from "next/link";
import { useApi } from "@/lib/api/client";
import { ReviewCard, Stars } from "./ReviewCard";
import type { Review } from "@/types";

/** Product pop-up: this item's latest reviews (up to 3) and a link to all of them on the Reviews page. */
export function ProductReviews({ id, name }: { id: string | number; name: string }) {
  const { data } = useApi<{ stats: { average: number; count: number }; reviews: Review[] }>(`/api/reviews?product=${encodeURIComponent(String(id))}`);
  if (!data) return null;
  const { stats, reviews } = data;
  return (
    <section className="product-reviews" id="productReviews" aria-labelledby="productReviewsTitle">
      <div className="product-reviews-head">
        <h3 id="productReviewsTitle">Reviews</h3>
        {stats.count > 0 && <span className="rating-mini"><Stars n={stats.average} /><strong>{stats.average.toFixed(1)}</strong><small>({stats.count})</small></span>}
      </div>
      {stats.count === 0
        ? <p className="product-reviews-empty">No reviews of {name} yet. <Link href={`/reviews?write=${encodeURIComponent(String(id))}#write`}>Write the first one</Link></p>
        : <>
            <div className="product-reviews-list">{reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} r={r} compact />)}</div>
            <p className="product-reviews-more">
              <Link href={`/reviews?product=${encodeURIComponent(String(id))}`}>{stats.count > 3 ? `See all ${stats.count} reviews` : "Open on the Reviews page"} →</Link>
              <Link href={`/reviews?write=${encodeURIComponent(String(id))}#write`}>Write a review</Link>
            </p>
          </>}
    </section>
  );
}
