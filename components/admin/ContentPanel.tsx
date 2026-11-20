"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useAdminCategories, useAdminNotice, useAdminProducts } from "@/hooks/useServices";
import { adminApi } from "@/lib/api/admin";
import { Panel, emptyRow, inputStyle } from "./shared";

/** Scrolling notice shown under the navbar. */
function NoticeEditor() {
  const { data, loaded } = useAdminNotice();
  const { showToast } = useUI();
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (data) { setText(data.text); setEnabled(data.enabled); } }, [data]);
  const dirty = !!data && (text !== data.text || enabled !== data.enabled);

  const save = async () => {
    const res = await adminApi.saveNotice({ enabled, text });
    if (!res.ok) { setMsg(res.error ?? ""); return; }
    setMsg("");
    showToast(enabled && text.trim() ? "Notice is live on the storefront." : "Notice saved (hidden).");
  };

  return (
    <Panel title="Notice bar" subtitle="A line of moving text shown under the navbar on every page. Use it for offers, delivery news or holidays.">
      <div className="admin-field">
        <label htmlFor="noticeText">Notice text</label>
        <textarea id="noticeText" rows={2} maxLength={300} placeholder="e.g. Eid offer: free delivery on all orders this week!" style={{ ...inputStyle, minHeight: 70 }}
          value={text} disabled={!loaded} onChange={(e) => { setText(e.target.value); setMsg(""); }} />
        <small style={{ color: "var(--muted)" }}>{text.length}/300</small>
      </div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", margin: ".6rem 0", fontSize: ".9rem" }}>
        <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setMsg(""); }} /> Show the notice to customers
      </label>
      {enabled && text.trim() && (
        <div style={{ margin: ".4rem 0 .8rem" }}>
          <small style={{ color: "var(--muted)" }}>Preview</small>
          <div className="notice-bar" style={{ borderRadius: ".6rem", marginTop: ".25rem" }}><div className="notice-track" style={{ animationDuration: "20s" }}><span className="notice-item">{text}</span><span className="notice-item">{text}</span></div></div>
        </div>
      )}
      <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
        <button className="admin-btn primary" type="button" disabled={!dirty} onClick={save}>Save notice</button>
        {dirty && <button className="admin-btn" type="button" onClick={() => { if (data) { setText(data.text); setEnabled(data.enabled); } setMsg(""); }}>Cancel</button>}
      </div>
      <p className="admin-form-msg" aria-live="polite">{msg}</p>
    </Panel>
  );
}

/** Category create / rename / hide / delete, plus assigning each perfume to a category. */
function CategoryEditor() {
  const categories = useAdminCategories();
  const products = useAdminProducts();
  const { showToast } = useUI();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [msg, setMsg] = useState("");

  const run = async (p: Promise<{ ok: boolean; error?: string }>, done?: string) => {
    const res = await p;
    if (!res.ok) { setMsg(res.error ?? "Something went wrong."); return false; }
    setMsg("");
    if (done) showToast(done);
    return true;
  };

  return (
    <>
      <Panel title="Categories" subtitle="Scent categories shown as filters in the shop. Hiding a category also hides the perfumes in it.">
        <div className="coupon-add-row">
          <div className="admin-field"><label htmlFor="newCategory">New category</label>
            <input id="newCategory" type="text" maxLength={40} placeholder="e.g. Oriental" style={inputStyle} value={name}
              onChange={(e) => { setName(e.target.value); setMsg(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void run(adminApi.addCategory(name), `${name.trim()} added.`).then((ok) => ok && setName("")); } }} />
          </div>
          <button className="admin-btn primary" type="button" style={{ alignSelf: "flex-end", height: 42 }}
            onClick={() => void run(adminApi.addCategory(name), `${name.trim()} added.`).then((ok) => ok && setName(""))}>Add category</button>
        </div>
        <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".8rem" }}>{msg}</p>
        <table className="admin-table">
          <thead><tr><th>Category</th><th>Perfumes</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {!categories.length && emptyRow(4, "No categories yet.")}
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editing?.id === c.id ? (
                    <input aria-label={`Rename ${c.name}`} type="text" maxLength={40} style={{ ...inputStyle, minHeight: 36, width: 180 }} value={editing.name} autoFocus
                      onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") void run(adminApi.renameCategory(c.id, editing.name), "Category renamed.").then((ok) => ok && setEditing(null)); if (e.key === "Escape") setEditing(null); }} />
                  ) : <strong>{c.name}</strong>}
                </td>
                <td>{c.products}</td>
                <td><span className={`pill ${c.hidden ? "off" : "live"}`}>{c.hidden ? "Hidden" : "Visible"}</span></td>
                <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                  {editing?.id === c.id ? (
                    <>
                      <button className="admin-btn primary" style={{ fontSize: ".75rem" }} type="button" onClick={() => void run(adminApi.renameCategory(c.id, editing.name), "Category renamed.").then((ok) => ok && setEditing(null))}>Save</button>
                      <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => { setEditing({ id: c.id, name: c.name }); setMsg(""); }}>Rename</button>
                      <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => void run(adminApi.setCategoryHidden(c.id, !c.hidden), c.hidden ? `${c.name} is visible again.` : `${c.name} hidden from the shop.`)}>{c.hidden ? "Show" : "Hide"}</button>
                      <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button"
                        onClick={() => { if (window.confirm(`Delete the category “${c.name}”?`)) void run(adminApi.removeCategory(c.id), "Category deleted."); }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div style={{ height: "1.25rem" }} />
      <Panel title="Perfume categories" subtitle="Choose which category each perfume belongs to.">
        <table className="admin-table">
          <thead><tr><th>Perfume</th><th>Category</th></tr></thead>
          <tbody>
            {!products.length && emptyRow(2, "No perfumes.")}
            {products.map((p) => (
              <tr key={p.id}>
                <td><strong style={{ fontSize: ".9rem" }}>{p.name}</strong></td>
                <td>
                  <select aria-label={`Category of ${p.name}`} style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".3rem .6rem" }} value={p.family}
                    onChange={(e) => void run(adminApi.assignCategory(p.id, e.target.value), `${p.name} moved to ${e.target.value}.`)}>
                    {!categories.some((c) => c.name === p.family) && <option value={p.family}>{p.family}</option>}
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}{c.hidden ? " (hidden)" : ""}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

export function ContentPanel() {
  return (
    <>
      <NoticeEditor />
      <div style={{ height: "1.25rem" }} />
      <CategoryEditor />
    </>
  );
}
