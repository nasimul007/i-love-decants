"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useAdminCategories, useCatalogOverrides, useProductDetails } from "@/hooks/useServices";
import { adminApi, catalogOverridesApi, type ProductDetails } from "@/lib/api/admin";
import { activeVolumes, applyToProduct, perfumesOf } from "@/lib/services/catalogOverrides";
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

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: ".7rem" } as const;
const sectionTitle = { margin: ".4rem 0 0", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--rose-deep)" } as const;
const hintStyle = { color: "var(--muted)", fontWeight: 500 } as const;
type Result = { ok: boolean; error?: string };

/**
 * Everything that defines a perfume, in one form: photos, name, parameters, description, notes and price per size.
 * The same form is used by Inventory (add + edit) and by Perfumes & prices, so every screen edits the same thing.
 */
export function PerfumeEditor({ p, onClose }: { p: ProductDetails; onClose: () => void }) {
  const { showToast } = useUI();
  const families = useAdminCategories().map((c) => c.name);
  const overrides = useCatalogOverrides();
  const volumes = activeVolumes(overrides);
  const base = perfumesOf(overrides).find((x) => x.id === p.id);
  const live = base ? applyToProduct(base, overrides).prices : {};
  const savedPrices: Record<number, string> = Object.fromEntries(volumes.map((v) => [v, live[v] === undefined ? "" : String(live[v])]));
  const pricesKey = JSON.stringify(savedPrices);

  const [draft, setDraft] = useState<Draft>(draftOf(p));
  const [prices, setPrices] = useState(savedPrices);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setPrices(savedPrices); }, [pricesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = draftOf(p);
  const detailsDirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => k !== "family" && draft[k] !== saved[k]);
  const pricesDirty = volumes.some((v) => (prices[v] ?? "") !== savedPrices[v]);
  const dirty = detailsDirty || pricesDirty || draft.family !== p.family;

  const save = async () => {
    setSaving(true);
    const { family, keyNotes, ...rest } = draft;
    // Family uses the same endpoint as Notice & categories, so both screens always agree.
    let res: Result = { ok: true };
    if (family !== p.family) res = await adminApi.assignCategory(p.id, family);
    if (res.ok && detailsDirty) res = await adminApi.saveProductDetails(p.id, { ...rest, keyNotes: keyNotes.split(",").map((n) => n.trim()).filter(Boolean) });
    if (res.ok && pricesDirty) res = await catalogOverridesApi.setProductPrices(p.id, Object.fromEntries(volumes.map((v) => [v, prices[v].trim() === "" ? null : Number(prices[v])])));
    setSaving(false);
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    setMsg(""); showToast(`${draft.name} saved.`); onClose();
  };

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => { setDraft({ ...draft, [k]: e.target.value }); setMsg(""); };
  const id = (k: string) => `pe-${p.id}-${k}`;
  const field = (k: keyof Draft, label: string, hint = "") => (
    <div className="admin-field">
      <label htmlFor={id(k)}>{label}{hint && <small style={hintStyle}> — {hint}</small>}</label>
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

  return (
    <div style={{ display: "grid", gap: ".7rem" }}>
      <PhotoManager p={p} />
      <h3 style={sectionTitle}>About the perfume</h3>
      <div style={grid}>
        {field("name", "Name", "as on the bottle")}
        {field("brand", "Brand")}
        {choice("family", "Scent family", families, null)}
        {choice("audience", "Audience", AUDIENCES, "Not set")}
        {choice("strength", "Strength", STRENGTHS, "Not set")}
        {choice("lasting", "Lasting", LASTING, "Not tested yet", " hrs")}
      </div>
      <small style={{ color: "var(--muted)" }}>Strength is the label printed on the bottle (an attar is “Attar/oil”, never EDT/EDP). Set Lasting only after a wear test or from community reports; blank is better than a guess.</small>
      {field("description", "Short description", "2–3 sentences, required")}
      {field("keyNotes", "Key notes", "separate with commas, e.g. oud, vanilla, bergamot")}
      <div style={grid}>
        {field("top", "Top notes", "blank if unknown")}
        {field("heart", "Heart notes", "blank if unknown")}
        {field("base", "Base notes", "blank if unknown")}
      </div>
      <h3 style={sectionTitle}>Shop card</h3>
      <div style={grid}>
        {field("badge", "Card badge", "e.g. Soft favourite")}
        {field("notes", "Card tagline", "e.g. Pear · peony · musk")}
      </div>
      <h3 style={sectionTitle}>Price per size (৳) <small style={{ ...hintStyle, textTransform: "none", letterSpacing: 0 }}>— leave a size empty to not sell it. Sizes are managed in “Perfumes & prices”.</small></h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem" }}>
        {volumes.map((v) => (
          <div className="admin-field" key={v} style={{ width: 100 }}>
            <label htmlFor={id(`ml${v}`)}>{v} ml</label>
            <input id={id(`ml${v}`)} type="number" inputMode="numeric" min={0} step={1} placeholder="—" style={inputStyle}
              value={prices[v] ?? ""} onChange={(e) => { setPrices({ ...prices, [v]: e.target.value }); setMsg(""); }} />
          </div>
        ))}
      </div>
      <p className="admin-form-msg" aria-live="polite">{msg}</p>
      <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
        <button className="admin-btn" type="button" onClick={onClose}>{dirty ? "Cancel" : "Close"}</button>
        <button className="admin-btn primary" type="button" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

/** Oils and gift sets: name, price, and (gift sets) the description customers read. */
export function ItemEditor({ item, onClose }: { item: { id: string; name: string; price: number; description?: string }; onClose: () => void }) {
  const { showToast } = useUI();
  const gift = item.description !== undefined;
  const [d, setD] = useState({ name: item.name, price: String(item.price), description: item.description ?? "" });
  const [msg, setMsg] = useState("");
  const dirty = d.name !== item.name || d.price !== String(item.price) || d.description !== (item.description ?? "");
  const save = async () => {
    const res = await adminApi.saveItem(item.id, { name: d.name, price: Number(d.price), ...(gift ? { description: d.description } : {}) });
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    showToast(`${d.name} saved.`); onClose();
  };
  return (
    <div style={{ display: "grid", gap: ".7rem" }}>
      <div style={grid}>
        <div className="admin-field"><label htmlFor={`ie-${item.id}-name`}>Name</label><input id={`ie-${item.id}-name`} type="text" maxLength={62} style={inputStyle} value={d.name} onChange={(e) => { setD({ ...d, name: e.target.value }); setMsg(""); }} /></div>
        <div className="admin-field"><label htmlFor={`ie-${item.id}-price`}>Price (৳)</label><input id={`ie-${item.id}-price`} type="number" inputMode="numeric" min={0} step={1} style={inputStyle} value={d.price} onChange={(e) => { setD({ ...d, price: e.target.value }); setMsg(""); }} /></div>
      </div>
      {gift && <div className="admin-field"><label htmlFor={`ie-${item.id}-desc`}>What’s in the set <small style={hintStyle}>— shown on the gift card</small></label><textarea id={`ie-${item.id}-desc`} rows={3} maxLength={300} style={{ ...inputStyle, minHeight: 72 }} value={d.description} onChange={(e) => { setD({ ...d, description: e.target.value }); setMsg(""); }} /></div>}
      <p className="admin-form-msg" aria-live="polite">{msg}</p>
      <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
        <button className="admin-btn" type="button" onClick={onClose}>{dirty ? "Cancel" : "Close"}</button>
        <button className="admin-btn primary" type="button" disabled={!dirty || !d.name.trim() || d.price === ""} onClick={save}>Save</button>
      </div>
    </div>
  );
}

function DetailsRow({ p }: { p: ProductDetails }) {
  const [open, setOpen] = useState(false);
  const facts = [p.brand, p.strength, p.audience, p.lasting && `${p.lasting} hrs`].filter(Boolean).join(" · ");
  return (
    <>
      <tr>
        <td style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/images/${p.images[0]}`} alt="" width={40} height={40} style={{ objectFit: "cover", borderRadius: ".5rem" }} /> : null}<span><strong>{p.name}</strong><br /><small style={{ color: "var(--muted)" }}>{p.family}</small></span></td>
        <td style={{ fontSize: ".8rem" }}>{facts || <span style={{ color: "var(--muted)" }}>Not set yet</span>}</td>
        <td style={{ fontSize: ".8rem" }}>{[p.top, p.heart, p.base].filter(Boolean).join(" · ") || <span style={{ color: "var(--muted)" }}>—</span>}</td>
        <td><button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Edit"}</button></td>
      </tr>
      {open && <tr><td colSpan={4} style={{ background: "#fbf6f1" }}><PerfumeEditor p={p} onClose={() => setOpen(false)} /></td></tr>}
    </>
  );
}

/** Every perfume with what customers see; Edit opens the same form as Inventory → Edit. */
export function ProductDetailsPanel() {
  const products = useProductDetails();
  return (
    <Panel title="Perfume details & photos" subtitle="Brand, family, audience, strength, lasting, notes, photos and prices: exactly what customers see. Empty fields stay hidden from customers. New perfumes are added in Inventory → Add product.">
      <table className="admin-table admin-table--stack">
        <thead><tr><th>Perfume</th><th>Brand · strength · audience · lasting</th><th>Notes (top · heart · base)</th><th>Actions</th></tr></thead>
        <tbody>
          {!products.length && emptyRow(4, "No perfumes yet.")}
          {products.map((p) => <DetailsRow key={p.id} p={p} />)}
        </tbody>
      </table>
    </Panel>
  );
}
