"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useAdminCategories, useProductDetails } from "@/hooks/useServices";
import { adminApi, type ProductDetails } from "@/lib/api/admin";
import { AUDIENCES, LASTING, STRENGTHS } from "@/lib/config";
import { shrinkImage } from "@/lib/imageResize";
import { Panel, emptyRow, inputStyle } from "./shared";

const MAX: Partial<Record<keyof Draft, number>> = { name: 80, badge: 30, brand: 60, keyNotes: 300 }; // same limits as the API
// Key notes are edited as "oud, vanilla" text and split on save.
type Draft = Omit<ProductDetails, "id" | "images" | "keyNotes"> & { keyNotes: string };
const draftOf = ({ id: _i, images: _img, keyNotes, ...rest }: ProductDetails): Draft => ({ ...rest, keyNotes: keyNotes.join(", ") });

/** Photos of one perfume: upload several, choose the main one, re-order, delete. Stored in the database. */
function PhotoManager({ p }: { p: ProductDetails }) {
  const { showToast } = useUI();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setMsg("");
    let added = 0;
    for (const f of Array.from(files)) {
      try {
        const res = await adminApi.uploadProductImage(p.id, await shrinkImage(f));
        if (!res.ok) { setMsg(res.error ?? "Upload failed."); break; }
        added++;
      } catch (e) { setMsg(e instanceof Error ? e.message : "Could not read that image."); break; }
    }
    setBusy(false);
    if (added) { await adminApi.photosChanged(); showToast(`${added} photo${added > 1 ? "s" : ""} added to ${p.name}.`); }
  };
  const small = { fontSize: ".7rem", padding: ".25rem .5rem" } as const;

  return (
    <div className="admin-field">
      <label>Photos <small style={{ color: "var(--muted)", fontWeight: 500 }}>— the first one is the main photo (up to 8). Without photos, customers see the drawn bottle.</small></label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".7rem", marginTop: ".4rem" }}>
        {p.images.map((id, i) => (
          <figure key={id} style={{ margin: 0, width: 112, display: "grid", gap: ".3rem", justifyItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/images/${id}`} alt={`${p.name} photo ${i + 1}`} width={112} height={112} style={{ objectFit: "cover", borderRadius: ".7rem", border: i === 0 ? "2px solid var(--rose-deep)" : "1px solid var(--line)" }} />
            <figcaption style={{ display: "flex", gap: ".2rem", flexWrap: "wrap", justifyContent: "center" }}>
              {i === 0 ? <span className="pill live" style={{ fontSize: ".65rem" }}>Main</span> : <button className="admin-btn" style={small} type="button" onClick={() => void adminApi.moveProductImage(id, "first")}>Make main</button>}
              <button className="admin-btn" style={small} type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => void adminApi.moveProductImage(id, "earlier")}>←</button>
              <button className="admin-btn" style={small} type="button" aria-label="Move later" disabled={i === p.images.length - 1} onClick={() => void adminApi.moveProductImage(id, "later")}>→</button>
              <button className="admin-btn danger" style={small} type="button" onClick={() => { if (window.confirm("Delete this photo?")) void adminApi.removeProductImage(id); }}>Delete</button>
            </figcaption>
          </figure>
        ))}
        {p.images.length < 8 && (
          <label style={{ width: 112, height: 112, display: "grid", placeItems: "center", textAlign: "center", border: "2px dashed var(--line)", borderRadius: ".7rem", cursor: busy ? "progress" : "pointer", color: "var(--rose-deep)", fontSize: ".78rem", fontWeight: 700 }}>
            {busy ? "Uploading…" : "+ Add photos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="admin-form-msg" aria-live="polite">{msg}</p>
    </div>
  );
}

function DetailsRow({ p, families }: { p: ProductDetails; families: string[] }) {
  const { showToast } = useUI();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftOf(p));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) setDraft(draftOf(p)); }, [p, open]);

  const saved = draftOf(p);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const save = async () => {
    setSaving(true);
    const { family, keyNotes, ...rest } = draft;
    // Family uses the same endpoint as Notice & categories, so both screens always agree.
    let res = family !== p.family ? await adminApi.assignCategory(p.id, family) : { ok: true, error: undefined as string | undefined };
    if (res.ok) res = await adminApi.saveProductDetails(p.id, { ...rest, keyNotes: keyNotes.split(",").map((n) => n.trim()).filter(Boolean) });
    setSaving(false);
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    setMsg(""); setOpen(false); showToast(`${p.name} updated.`);
  };
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });
  const id = (k: string) => `pd-${p.id}-${k}`;
  const field = (k: keyof Draft, label: string, hint = "") => (
    <div className="admin-field">
      <label htmlFor={id(k)}>{label}{hint && <small style={{ color: "var(--muted)", fontWeight: 500 }}> — {hint}</small>}</label>
      {k === "description"
        ? <textarea id={id(k)} rows={3} maxLength={1000} style={{ ...inputStyle, minHeight: 84 }} value={draft[k]} onChange={set(k)} />
        : <input id={id(k)} type="text" maxLength={MAX[k] ?? 120} style={inputStyle} value={draft[k]} onChange={set(k)} />}
    </div>
  );
  const choice = (k: keyof Draft, label: string, options: readonly string[], blank: string | null, suffix = "") => (
    <div className="admin-field">
      <label htmlFor={id(k)}>{label}</label>
      <select id={id(k)} style={inputStyle} value={draft[k]} onChange={set(k)}>
        {blank !== null ? <option value="">{blank}</option> : !options.includes(draft[k]) && <option value={draft[k]}>{draft[k]}</option>}
        {options.map((o) => <option key={o} value={o}>{o}{suffix}</option>)}
      </select>
    </div>
  );
  const facts = [p.brand, p.strength, p.audience, p.lasting && `${p.lasting} hrs`].filter(Boolean).join(" · ");

  return (
    <>
      <tr>
        <td style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/images/${p.images[0]}`} alt="" width={40} height={40} style={{ objectFit: "cover", borderRadius: ".5rem" }} /> : null}<span><strong>{p.name}</strong><br /><small style={{ color: "var(--muted)" }}>{p.family}</small></span></td>
        <td style={{ fontSize: ".8rem" }}>{facts || <span style={{ color: "var(--muted)" }}>Not set yet</span>}</td>
        <td style={{ fontSize: ".8rem" }}>{[p.top, p.heart, p.base].filter(Boolean).join(" · ") || <span style={{ color: "var(--muted)" }}>—</span>}</td>
        <td><button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Edit"}</button></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={4} style={{ background: "#fbf6f1" }}>
            <div style={{ display: "grid", gap: ".7rem", padding: ".4rem 0" }}>
              <PhotoManager p={p} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".7rem" }}>
                {field("name", "Name", "as on the original bottle")}
                {field("badge", "Card badge", "e.g. Soft favourite")}
                {field("notes", "Card tagline", "e.g. Pear · peony · musk")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".7rem" }}>
                {field("brand", "Brand", "as on the bottle")}
                {choice("family", "Scent family", families, null)}
                {choice("audience", "Audience", AUDIENCES, "Not set")}
                {choice("strength", "Strength", STRENGTHS, "Not set")}
                {choice("lasting", "Lasting", LASTING, "Not tested yet", " hrs")}
              </div>
              <small style={{ color: "var(--muted)" }}>Strength is the label printed on the bottle (an attar is “Attar/oil”, never EDT/EDP). Set Lasting only after a wear test or from community reports; blank is better than a guess.</small>
              {field("description", "Short description", "2–3 sentences")}
              {field("keyNotes", "Key notes", "separate with commas, e.g. oud, vanilla, bergamot")}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".7rem" }}>
                {field("top", "Top notes", "blank if unknown")}
                {field("heart", "Heart notes", "blank if unknown")}
                {field("base", "Base notes", "blank if unknown")}
              </div>
              <p className="admin-form-msg" aria-live="polite">{msg}</p>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button className="admin-btn primary" type="button" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
                <button className="admin-btn" type="button" onClick={() => { setDraft(draftOf(p)); setMsg(""); setOpen(false); }}>Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Everything that defines a perfume for customers: photos, parameters, description and notes. */
export function ProductDetailsPanel() {
  const products = useProductDetails();
  const families = useAdminCategories().map((c) => c.name);
  return (
    <Panel title="Perfume details & photos" subtitle="Brand, family, audience, strength, lasting, notes and photos: exactly what customers see on the shop, the homepage and in the product pop-up. Empty fields stay hidden from customers.">
      <table className="admin-table admin-table--stack">
        <thead><tr><th>Perfume</th><th>Brand · strength · audience · lasting</th><th>Notes (top · heart · base)</th><th>Actions</th></tr></thead>
        <tbody>
          {!products.length && emptyRow(4, "No perfumes yet.")}
          {products.map((p) => <DetailsRow key={p.id} p={p} families={families} />)}
        </tbody>
      </table>
    </Panel>
  );
}
