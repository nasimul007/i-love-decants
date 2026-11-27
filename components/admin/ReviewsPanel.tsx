"use client";

import { useState } from "react";
import { useAdminReviews } from "@/hooks/useServices";
import { useUI } from "@/components/providers/UIProvider";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import { Modal, Panel, emptyRow, inputStyle } from "./shared";
import { PhotoManager } from "./ProductEditor";
import type { Review } from "@/types";

const SOURCE_LABEL: Record<Review["source"], string> = { website: "Website", whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", other: "Other" };
const BLANK = { name: "", rating: "5", text: "", source: "whatsapp" as Review["source"], link: "", product: "", status: "published" as Review["status"], featured: false, date: "" };
const hint = { color: "var(--muted)", fontWeight: 500 } as const;

/** Reviews: approve website reviews, add ones received on WhatsApp / Facebook / Instagram (with a link to the post and screenshots), choose the home-page three. */
export function ReviewsPanel() {
  const reviews = useAdminReviews();
  const { showToast } = useUI();
  const [filter, setFilter] = useState<"all" | Review["status"]>("all");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [f, setF] = useState(BLANK);
  const [msg, setMsg] = useState("");
  const pending = reviews.filter((r) => r.status === "pending").length;
  const current = typeof editing === "number" ? reviews.find((r) => r.id === editing) : undefined;

  const open = (r?: Review) => {
    setMsg("");
    setEditing(r ? r.id : "new");
    setF(r ? { name: r.name, rating: String(r.rating), text: r.text, source: r.source, link: r.link, product: r.product, status: r.status, featured: r.featured, date: r.date.slice(0, 10) } : BLANK);
  };
  const save = async () => {
    const res = await adminApi.saveReview(editing === "new" ? null : (editing as number), { ...f, rating: Number(f.rating), date: f.date || null });
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    showToast("Review saved.");
    if (editing === "new" && res.data) setEditing(res.data.id); // stay open so screenshots can be added
    else setEditing(null);
  };
  const patch = (r: Review, data: Partial<Review>) => void adminApi.saveReview(r.id, data);
  const remove = async (r: Review) => {
    if (!window.confirm(`Delete the review by ${r.name}? This cannot be undone.`)) return;
    const res = await adminApi.deleteReview(r.id);
    showToast(res.ok ? "Review deleted." : res.error ?? "Could not delete.");
  };
  const shown = reviews.filter((r) => filter === "all" || r.status === filter);
  const btn = { fontSize: ".75rem" } as const;

  return (
    <Panel
      title="Reviews"
      subtitle={`Customer reviews on the Reviews page and the home page. Reviews written on the website wait here as “Pending” until you publish them${pending ? ` (${pending} waiting)` : ""}. Add reviews from WhatsApp, Facebook or Instagram yourself; with a link, the review opens that post. The home page shows only the published reviews switched to “On home page” (up to 6); with none switched on, the home page has no reviews section.`}
      action={<button className="admin-btn primary" type="button" onClick={() => open()}>Add review</button>}
    >
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".8rem" }}>
        {(["all", "pending", "published", "hidden"] as const).map((s) => (
          <button key={s} type="button" className={`admin-btn${filter === s ? " primary" : ""}`} style={btn} onClick={() => setFilter(s)}>
            {s === "all" ? `All (${reviews.length})` : `${s[0].toUpperCase()}${s.slice(1)} (${reviews.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>
      <table className="admin-table">
        <thead><tr><th>Review</th><th>From</th><th>Rating</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {!shown.length && emptyRow(6, filter === "pending" ? "No reviews waiting." : "No reviews yet. Add one, or wait for customers to write on the website.")}
          {shown.map((r) => (
            <tr key={r.id}>
              <td style={{ maxWidth: 340 }}>
                <strong style={{ display: "block", fontSize: ".88rem" }}>{r.name}{r.product ? ` · ${r.product}` : ""}</strong>
                <small style={{ color: "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</small>
                {r.images.length > 0 && <small style={{ color: "var(--muted)" }}>{r.images.length} photo{r.images.length > 1 ? "s" : ""}</small>}
              </td>
              <td>{SOURCE_LABEL[r.source]}{r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: ".72rem", color: "var(--rose-deep)" }}>Open post ↗</a>}</td>
              <td style={{ color: "#c98a2e", whiteSpace: "nowrap" }} aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span style={{ color: "var(--sand-deep)" }}>{"★".repeat(5 - r.rating)}</span></td>
              <td className="hist-time">{formatDate(r.date)}</td>
              <td>
                <span className={`pill ${r.status === "published" ? "live" : "off"}`}>{r.status === "published" ? "Published" : r.status === "pending" ? "Pending" : "Hidden"}</span>
                {r.featured && <span className="pill live" style={{ marginLeft: ".3rem" }} title={r.status === "published" ? "Shown on the home page" : "Switched on, but only published reviews are shown"}>{r.status === "published" ? "On home" : "On home (not published)"}</span>}
              </td>
              <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                {r.status !== "published" && <button className="admin-btn primary" style={btn} type="button" onClick={() => patch(r, { status: "published" })}>Publish</button>}
                {r.status === "published" && <button className="admin-btn" style={btn} type="button" onClick={() => patch(r, { status: "hidden" })}>Hide</button>}
                <button className="admin-btn" style={{ ...btn, color: "var(--rose-deep)" }} type="button" aria-pressed={r.featured} onClick={() => patch(r, { featured: !r.featured })}>{r.featured ? "★ On home page" : "☆ Add to home page"}</button>
                <button className="admin-btn" style={btn} type="button" onClick={() => open(r)}>Edit</button>
                <button className="admin-btn danger" style={btn} type="button" onClick={() => void remove(r)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={editing !== null} onClose={() => setEditing(null)} wide title={editing === "new" ? "Add a review" : `Review by ${current?.name ?? ""}`} subtitle="Copy the customer's words as they wrote them. For Facebook, paste the link to the post or comment so customers can open it.">
        <div className="mgr-form">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: ".75rem" }}>
            <div className="admin-field"><label htmlFor="revName">Customer name</label><input id="revName" style={inputStyle} maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="admin-field"><label htmlFor="revSource">Where it came from</label>
              <select id="revSource" style={inputStyle} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as Review["source"] })}>
                {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="admin-field"><label htmlFor="revRating">Rating</label>
              <select id="revRating" style={inputStyle} value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div className="admin-field"><label htmlFor="revDate">Date <small style={hint}>(optional)</small></label><input id="revDate" type="date" style={inputStyle} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          </div>
          <div className="admin-field"><label htmlFor="revText">Review</label><textarea id="revText" rows={4} maxLength={1200} style={{ ...inputStyle, minHeight: 100 }} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: ".75rem" }}>
            <div className="admin-field"><label htmlFor="revLink">Link to the post <small style={hint}>(optional, https://…)</small></label><input id="revLink" type="url" style={inputStyle} placeholder="https://www.facebook.com/…" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /></div>
            <div className="admin-field"><label htmlFor="revProduct">Product <small style={hint}>(optional)</small></label><input id="revProduct" style={inputStyle} maxLength={80} value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} /></div>
            <div className="admin-field"><label htmlFor="revStatus">Status</label>
              <select id="revStatus" style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Review["status"] })}>
                <option value="published">Published</option><option value="pending">Pending</option><option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          <label style={{ display: "flex", gap: ".5rem", alignItems: "center", fontSize: ".85rem", fontWeight: 700 }}><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Show on the home page (only published reviews, up to 6)</label>
          {current
            ? <PhotoManager p={{ id: `review-${current.id}`, name: `Review by ${current.name}`, images: current.images }} hint="screenshots of the chat or post, or a customer photo (up to 8)." />
            : <p style={{ color: "var(--muted)", fontSize: ".8rem", margin: 0 }}>Save first, then you can add screenshots or photos.</p>}
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <div className="mgr-modal-actions">
            <button className="admin-btn" type="button" onClick={() => setEditing(null)}>Close</button>
            <button className="admin-btn primary" type="button" onClick={() => void save()}>{editing === "new" ? "Save and add photos" : "Save"}</button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
