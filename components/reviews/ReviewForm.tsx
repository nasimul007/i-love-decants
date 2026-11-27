"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { call } from "@/lib/api/client";

/** "Write a review": goes to Admin → Reviews as Pending; shown on the site once approved. */
export function ReviewForm() {
  const [f, setF] = useState({ name: "", rating: 0, product: "", text: "", company: "" });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.rating) { setMsg({ text: "Choose a star rating.", ok: false }); return; }
    setBusy(true);
    const res = await call("POST", "/api/reviews", f);
    setBusy(false);
    if (!res.ok) { setMsg({ text: res.error ?? "Could not send your review.", ok: false }); return; }
    setF({ name: "", rating: 0, product: "", text: "", company: "" });
    setMsg({ text: "Thank you! Your review will appear here once we have checked it.", ok: true });
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <fieldset className="star-input">
        <legend>Your rating<span className="req" aria-hidden="true">*</span></legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= f.rating ? "is-on" : ""}>
            <input type="radio" name="rating" value={n} checked={f.rating === n} onChange={() => { setF({ ...f, rating: n }); setMsg(null); }} />
            <span aria-hidden="true">★</span><span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
          </label>
        ))}
      </fieldset>
      <div className="field"><label htmlFor="revName">Your name<span className="req" aria-hidden="true">*</span></label><input id="revName" type="text" autoComplete="name" maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="field"><label htmlFor="revProduct">What did you buy? <small>(optional)</small></label><input id="revProduct" type="text" maxLength={80} placeholder="e.g. Amber Light, 6 ml" value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} /></div>
      <div className="field"><label htmlFor="revText">Your review<span className="req" aria-hidden="true">*</span></label><textarea id="revText" maxLength={800} placeholder="How did it smell, last, arrive?" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
      <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      <p className={`review-form-msg${msg ? (msg.ok ? " ok" : " err") : ""}`} aria-live="polite">{msg?.text}</p>
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send review"}</button>
    </form>
  );
}
