"use client";

import { useT } from "@/components/providers/PrefsProvider";
import type { CSSProperties } from "react";

const STEPS = ["Bag", "Details", "Done"];

/**
 * Slim progress bar for the order flow: checkout = half done, confirmation = complete.
 * Step names sit at their point on the bar (start / middle / end); the percentage sits under the end of the fill.
 */
export function CheckoutProgress({ done = false }: { done?: boolean }) {
  const pct = done ? 100 : 50;
  const t = useT();
  const reached = done ? STEPS.length : 1; // steps fully completed
  return (
    <div className="checkout-progress" role="progressbar" aria-label={t("Order progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      aria-valuetext={done ? t("Order placed") : t("Step 2 of 3: your details")} style={{ "--pct": `${pct}%` } as CSSProperties}>
      <ol className="checkout-progress-steps">
        {STEPS.map((s, i) => <li key={s} className={i < reached ? "is-done" : i === reached ? "is-current" : undefined}>{t(s)}</li>)}
      </ol>
      <div className="checkout-progress-track"><span /></div>
      <strong className={`checkout-progress-pct${done ? " is-end" : ""}`}>{done ? `100% · ${t("Order placed")}` : `50% · ${t("Almost there")}`}</strong>
    </div>
  );
}
