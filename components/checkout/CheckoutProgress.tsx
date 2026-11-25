const STEPS = ["Bag", "Details", "Done"];

/** Slim progress bar for the order flow: checkout = half done, confirmation = complete. */
export function CheckoutProgress({ done = false }: { done?: boolean }) {
  const pct = done ? 100 : 50;
  const reached = done ? STEPS.length : 1; // steps fully completed
  return (
    <div className="checkout-progress" role="progressbar" aria-label="Order progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={done ? "Order placed" : "Step 2 of 3: your details"}>
      <div className="checkout-progress-head">
        <ol className="checkout-progress-steps">
          {STEPS.map((s, i) => <li key={s} className={i < reached ? "is-done" : i === reached ? "is-current" : undefined}>{s}</li>)}
        </ol>
        <strong>{done ? "100% · Order placed" : "50% · Almost there"}</strong>
      </div>
      <div className="checkout-progress-track"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
