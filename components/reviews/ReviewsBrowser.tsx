"use client";

import { useState } from "react";
import { ReviewCard, SOURCES } from "./ReviewCard";
import type { Review } from "@/types";

/** Review wall with source filters (only sources that have reviews) and a sort. */
export function ReviewsBrowser({ reviews }: { reviews: Review[] }) {
  const [source, setSource] = useState<Review["source"] | "all">("all");
  const [sort, setSort] = useState<"newest" | "highest">("newest");
  const sources = (Object.keys(SOURCES) as Review["source"][]).filter((s) => reviews.some((r) => r.source === s));
  const shown = reviews.filter((r) => source === "all" || r.source === source)
    .sort((a, b) => sort === "highest" ? b.rating - a.rating || +new Date(b.date) - +new Date(a.date) : +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <div className="reviews-toolbar">
        {sources.length > 1 && (
          <div className="review-chips" role="group" aria-label="Show reviews from">
            {(["all", ...sources] as const).map((s) => (
              <button key={s} type="button" className={`review-chip${source === s ? " is-active" : ""}`} aria-pressed={source === s} onClick={() => setSource(s)}>
                {s === "all" ? `All (${reviews.length})` : `${SOURCES[s].label} (${reviews.filter((r) => r.source === s).length})`}
              </button>
            ))}
          </div>
        )}
        <label className="review-sort">Sort
          <select className="soft-select" value={sort} onChange={(e) => setSort(e.target.value as "newest" | "highest")}>
            <option value="newest">Newest first</option><option value="highest">Highest rated</option>
          </select>
        </label>
      </div>
      <div className="review-grid">{shown.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
    </>
  );
}
