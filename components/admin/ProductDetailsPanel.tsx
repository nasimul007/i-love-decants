"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useProductDetails } from "@/hooks/useServices";
import { adminApi, type ProductDetails } from "@/lib/api/admin";
import { shrinkImage } from "@/lib/imageResize";
import { Panel, emptyRow, inputStyle } from "./shared";

type Draft = Pick<ProductDetails, "description" | "top" | "heart" | "base">;
const draftOf = (p: ProductDetails): Draft => ({ description: p.description, top: p.top, heart: p.heart, base: p.base });

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

function DetailsRow({ p }: { p: ProductDetails }) {
  const { showToast } = useUI();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(draftOf(p));
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) setDraft(draftOf(p)); }, [p, open]);

  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== p[k]);
  const save = async () => {
    setSaving(true);
    const res = await adminApi.saveProductDetails(p.id, draft);
    setSaving(false);
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    setMsg(""); setOpen(false); showToast(`${p.name} updated.`);
  };
  const field = (k: keyof Draft, label: string, rows = 1) => (
    <div className="admin-field">
      <label htmlFor={`pd-${p.id}-${k}`}>{label}</label>
      {rows > 1
        ? <textarea id={`pd-${p.id}-${k}`} rows={rows} maxLength={1000} style={{ ...inputStyle, minHeight: 84 }} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
        : <input id={`pd-${p.id}-${k}`} type="text" maxLength={120} style={inputStyle} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />}
    </div>
  );

  return (
    <>
      <tr>
        <td style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/images/${p.images[0]}`} alt="" width={40} height={40} style={{ objectFit: "cover", borderRadius: ".5rem" }} /> : null}<span><strong>{p.name}</strong><br /><small style={{ color: "var(--muted)" }}>{p.family}</small></span></td>
        <td style={{ maxWidth: 320, fontSize: ".82rem", color: "var(--muted)" }}>{p.description.length > 90 ? `${p.description.slice(0, 90)}…` : p.description}</td>
        <td style={{ fontSize: ".8rem" }}>{p.top} · {p.heart} · {p.base}</td>
        <td><button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Edit"}</button></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={4} style={{ background: "#fbf6f1" }}>
            <div style={{ display: "grid", gap: ".7rem", padding: ".4rem 0" }}>
              <PhotoManager p={p} />
              {field("description", "Description", 3)}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".7rem" }}>
                {field("top", "Top notes")}
                {field("heart", "Heart notes")}
                {field("base", "Base notes")}
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

/** Edit each perfume's description and top / heart / base notes (shown in the product pop-up). */
export function ProductDetailsPanel() {
  const products = useProductDetails();
  return (
    <Panel title="Perfume details & photos" subtitle="Edit the description, the top / heart / base notes and the photos customers see on the shop, the homepage and in the product pop-up.">
      <table className="admin-table">
        <thead><tr><th>Perfume</th><th>Description</th><th>Notes (top · heart · base)</th><th>Actions</th></tr></thead>
        <tbody>
          {!products.length && emptyRow(4, "No perfumes yet.")}
          {products.map((p) => <DetailsRow key={p.id} p={p} />)}
        </tbody>
      </table>
    </Panel>
  );
}
