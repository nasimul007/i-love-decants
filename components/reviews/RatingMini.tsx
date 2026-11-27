"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { useRatings } from "@/hooks/useServices";
import { Stars } from "./ReviewCard";

/** "★★★★★ 4.8 (12)" for one shop item; nothing until it has a published review. */
export function RatingMini({ id, onClick }: { id: string | number; onClick?: () => void }) {
  const r = useRatings()[String(id)];
  const t = useT();
  if (!r) return null;
  const label = t(r.count === 1 ? "{avg} out of 5 from {n} review" : "{avg} out of 5 from {n} reviews", { avg: r.average.toFixed(1), n: r.count });
  const inner = <><Stars n={r.average} /><strong>{r.average.toFixed(1)}</strong><small>({r.count})</small></>;
  return onClick
    ? <button type="button" className="rating-mini" aria-label={`${label}. ${t("Read the reviews")}`} onClick={onClick}>{inner}</button>
    : <span className="rating-mini" role="img" aria-label={label}>{inner}</span>;
}
