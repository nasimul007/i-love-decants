"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ReviewCard, SOURCES, Stars } from "./ReviewCard";
import type { Review } from "@/types";

const PAGE = 12;

/** Reviews page: summary with clickable star bars (filter by rating), source chips, sort, "Show more" after 12.
 *  `product`: showing one item's reviews (from a product pop-up); `side` is the write-a-review card. */
export function ReviewsBrowser({ reviews, product, side }: { reviews: Review[]; product?: { id: string; name: string }; side: ReactNode }) {
  const [source, setSource] = useState<Review["source"] | "all">("all");
  const [stars, setStars] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "highest">("newest");
  const [shown, setShown] = useState(PAGE);
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const sources = (Object.keys(SOURCES) as Review["source"][]).filter((s) => reviews.some((r) => r.source === s));
  const list = reviews.filter((r) => (source === "all" || r.source === source) && (stars === null || r.rating === stars))
    .sort((a, b) => sort === "highest" ? b.rating - a.rating || +new Date(b.date) - +new Date(a.date) : +new Date(b.date) - +new Date(a.date));
  const pick = <T,>(set: (v: T) => void) => (v: T) => { set(v); setShown(PAGE); };

  return (
    <div className="container reviews-layout">
      <aside className="reviews-side">
        {count > 0 && (
          <div className="review-summary">
            <strong className="review-average">{average.toFixed(1)}</strong>
            <Stars n={average} size="lg" />
            <small>{count} review{count === 1 ? "" : "s"}{product ? ` of ${product.name}` : ""}</small>
            <ul className="review-bars" aria-label="Ratings breakdown. Choose a row to show only those reviews.">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = reviews.filter((r) => r.rating === n).length;
                return (
                  <li key={n}>
                    <button type="button" className={`review-bar-row${stars === n ? " is-active" : ""}`} disabled={!c} aria-pressed={stars === n} onClick={() => pick(setStars)(stars === n ? null : n)}>
                      <span>{n} ★</span><span className="review-bar"><span style={{ width: `${(c / count) * 100}%` }} /></span><span>{c}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {side}
      </aside>
      <div className="reviews-main">
        {product && <p className="review-scope">Showing reviews of <strong>{product.name}</strong> · <Link href="/reviews">See all reviews</Link></p>}
        <div className="reviews-toolbar">
          <div className="review-chips" role="group" aria-label="Show reviews from">
            {sources.length > 1 && (["all", ...sources] as const).map((s) => (
              <button key={s} type="button" className={`review-chip${source === s ? " is-active" : ""}`} aria-pressed={source === s} onClick={() => pick(setSource)(s)}>
                {s === "all" ? `All (${count})` : `${SOURCES[s].label} (${reviews.filter((r) => r.source === s).length})`}
              </button>
            ))}
            {stars !== null && <button type="button" className="review-chip is-active" onClick={() => pick(setStars)(null)} aria-label={`Showing ${stars} star reviews. Show all ratings`}>{stars} ★ only ✕</button>}
          </div>
          <label className="review-sort">Sort
            <select className="soft-select" value={sort} onChange={(e) => pick(setSort)(e.target.value as "newest" | "highest")}>
              <option value="newest">Newest first</option><option value="highest">Highest rated</option>
            </select>
          </label>
        </div>
        {count === 0 && <p className="acct-empty">No reviews yet. Be the first to write one.</p>}
        {count > 0 && !list.length && <p className="acct-empty">No reviews match. <button type="button" className="coupon-signin" onClick={() => { pick(setSource)("all"); setStars(null); }}>Show all</button></p>}
        <div className="review-grid">{list.slice(0, shown).map((r) => <ReviewCard key={r.id} r={r} />)}</div>
        {list.length > shown && (
          <div className="review-more"><button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>Show more reviews ({list.length - shown} more)</button></div>
        )}
      </div>
    </div>
  );
}
