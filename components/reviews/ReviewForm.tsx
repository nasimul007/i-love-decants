"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useCatalog, useCurrentCustomer } from "@/hooks/useServices";
import { shrinkImage } from "@/lib/imageResize";

const MAX_PHOTOS = 3;
const BLANK = { name: "", rating: 0, productId: "", text: "", company: "" };

/** "Write a review": goes to Admin → Reviews as Pending; shown on the site once approved. Up to 3 photos. */
export function ReviewForm({ defaultProduct = "" }: { defaultProduct?: string }) {
  const { products, oils, gifts } = useCatalog();
  const customer = useCurrentCustomer();
  const [f, setF] = useState({ ...BLANK, productId: defaultProduct });
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useT();
  useEffect(() => { if (customer && !f.name) setF((x) => ({ ...x, name: customer.name })); }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const out: { blob: Blob; url: string }[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      try { const blob = await shrinkImage(file); out.push({ blob, url: URL.createObjectURL(blob) }); }
      catch (e) { setMsg({ text: t(e instanceof Error ? e.message : "Could not read that photo."), ok: false }); }
    }
    if (files.length > room) setMsg({ text: t("You can add up to {n} photos.", { n: MAX_PHOTOS }), ok: false });
    setPhotos((p) => [...p, ...out]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.rating) { setMsg({ text: t("Choose a star rating."), ok: false }); return; }
    setBusy(true);
    const body = new FormData();
    for (const [k, v] of Object.entries(f)) body.set(k, String(v));
    photos.forEach((p, i) => body.append("photo", p.blob, `photo-${i + 1}.webp`));
    const res = await fetch("/api/reviews", { method: "POST", body, credentials: "same-origin" }).catch(() => null);
    const json = await res?.json().catch(() => ({})) as { error?: string; verified?: boolean } | undefined;
    setBusy(false);
    if (!res?.ok) { setMsg({ text: t(json?.error ?? "Could not send your review. Please try again."), ok: false }); return; }
    setF({ ...BLANK, name: customer?.name ?? "" }); photos.forEach((p) => URL.revokeObjectURL(p.url)); setPhotos([]);
    setMsg({ text: t("Thank you! Your review will appear here once we have checked it.") + (json?.verified ? " " + t("It will show a “Verified buyer” badge.") : ""), ok: true });
  };

  const lit = hover || f.rating;
  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <fieldset className="star-input" onMouseLeave={() => setHover(0)}>
        <legend>{t("Your rating")}<span className="req" aria-hidden="true">*</span></legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= lit ? "is-on" : ""} onMouseEnter={() => setHover(n)}>
            <input type="radio" name="rating" value={n} checked={f.rating === n} onChange={() => { setF({ ...f, rating: n }); setMsg(null); }} />
            <span aria-hidden="true">★</span><span className="sr-only">{t(n > 1 ? "{n} stars" : "{n} star", { n })}</span>
          </label>
        ))}
      </fieldset>
      <div className="field"><label htmlFor="revName">{t("Your name")}<span className="req" aria-hidden="true">*</span></label><input id="revName" type="text" autoComplete="name" maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="field"><label htmlFor="revProduct">{t("What did you buy?")} <small>{t("(optional)")}</small></label>
        <select id="revProduct" value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
          <option value="">{t("The shop in general")}</option>
          {products.length > 0 && <optgroup label={t("Perfume decants")}>{products.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}</optgroup>}
          {oils.length > 0 && <optgroup label={t("Perfume oils")}>{oils.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</optgroup>}
          {gifts.length > 0 && <optgroup label={t("Gift sets")}>{gifts.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>}
        </select>
      </div>
      <div className="field"><label htmlFor="revText">{t("Your review")}<span className="req" aria-hidden="true">*</span></label><textarea id="revText" maxLength={800} placeholder={t("How did it smell, last, arrive?")} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
      <div className="field">
        <span className="review-photo-label">{t("Photos")} <small>{t("(optional, up to {n})", { n: MAX_PHOTOS })}</small></span>
        <div className="review-photo-row">
          {photos.map((p, i) => (
            <figure key={p.url} className="review-photo-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={t("Your photo {n}", { n: i + 1 })} />
              <button type="button" aria-label={t("Remove photo {n}", { n: i + 1 })} onClick={() => { URL.revokeObjectURL(p.url); setPhotos(photos.filter((x) => x !== p)); }}>×</button>
            </figure>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="review-photo-add">+ {t("Add")}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} /></label>
          )}
        </div>
      </div>
      <input className="hp-field" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      {!customer && <p className="review-form-hint">{t("Signed-in customers who received their order get a “Verified buyer” badge.")}</p>}
      <p className={`review-form-msg${msg ? (msg.ok ? " ok" : " err") : ""}`} aria-live="polite">{msg?.text}</p>
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? t("Sending…") : t("Send review")}</button>
    </form>
  );
}
