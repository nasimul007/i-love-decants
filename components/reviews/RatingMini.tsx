"use client";

import { useRatings } from "@/hooks/useServices";
import { Stars } from "./ReviewCard";

/** "★★★★★ 4.8 (12)" for one shop item; nothing until it has a published review. */
export function RatingMini({ id, onClick }: { id: string | number; onClick?: () => void }) {
  const r = useRatings()[String(id)];
  if (!r) return null;
  const label = `${r.average.toFixed(1)} out of 5 from ${r.count} review${r.count === 1 ? "" : "s"}`;
  const inner = <><Stars n={r.average} /><strong>{r.average.toFixed(1)}</strong><small>({r.count})</small></>;
  return onClick
    ? <button type="button" className="rating-mini" aria-label={`${label}. Read the reviews`} onClick={onClick}>{inner}</button>
    : <span className="rating-mini" role="img" aria-label={label}>{inner}</span>;
}
