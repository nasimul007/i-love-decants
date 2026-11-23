"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/components/providers/UIProvider";
import { useAdminCategories, useAdminFaqs, useAdminNotices, useAdminProducts } from "@/hooks/useServices";
import { adminApi } from "@/lib/api/admin";
import { Panel, emptyRow, inputStyle } from "./shared";

/** Messages of the moving notice bar under the navbar (all enabled ones scroll one after another). */
function NoticeEditor() {
  const notices = useAdminNotices();
  const { showToast } = useUI();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [msg, setMsg] = useState("");

  const run = async (p: Promise<{ ok: boolean; error?: string }>, done?: string) => {
    const res = await p;
    if (!res.ok) { setMsg(res.error ?? "Something went wrong."); return false; }
    setMsg("");
    if (done) showToast(done);
    return true;
  };
  const add = () => void run(adminApi.addNotice(text), "Notice added.").then((ok) => ok && setText(""));
  const live = notices.filter((n) => n.enabled).length;

  return (
    <Panel title="Notice bar" subtitle={`Moving text under the navbar on every page. Add as many notices as you like; all switched-on notices scroll one after another. ${live} on now.`}>
      <div className="admin-field">
        <label htmlFor="noticeText">New notice</label>
        <textarea id="noticeText" rows={2} maxLength={300} placeholder="e.g. Eid offer: free delivery on all orders this week!" style={{ ...inputStyle, minHeight: 64 }}
          value={text} onChange={(e) => { setText(e.target.value); setMsg(""); }} />
        <small style={{ color: "var(--muted)" }}>{text.length}/300</small>
      </div>
      <div style={{ display: "flex", gap: ".6rem", margin: ".4rem 0 .2rem" }}>
        <button className="admin-btn primary" type="button" disabled={!text.trim()} onClick={add}>Add notice</button>
      </div>
      <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".6rem" }}>{msg}</p>

      <table className="admin-table">
        <thead><tr><th>Notice</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {!notices.length && emptyRow(3, "No notices yet. The bar stays hidden until you add one.")}
          {notices.map((n) => (
            <tr key={n.id}>
              <td style={{ maxWidth: 380 }}>
                {editing?.id === n.id ? (
                  <textarea aria-label="Edit notice" rows={2} maxLength={300} style={{ ...inputStyle, minHeight: 56 }} value={editing.text} autoFocus
                    onChange={(e) => setEditing({ id: n.id, text: e.target.value })} />
                ) : <span style={{ fontSize: ".88rem", opacity: n.enabled ? 1 : 0.55 }}>{n.text}</span>}
              </td>
              <td><span className={`pill ${n.enabled ? "live" : "off"}`}>{n.enabled ? "On" : "Off"}</span></td>
              <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                {editing?.id === n.id ? (
                  <>
                    <button className="admin-btn primary" style={{ fontSize: ".75rem" }} type="button" onClick={() => void run(adminApi.editNotice(n.id, editing.text), "Notice updated.").then((ok) => ok && setEditing(null))}>Save</button>
                    <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => { setEditing(null); setMsg(""); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => { setEditing({ id: n.id, text: n.text }); setMsg(""); }}>Edit</button>
                    <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => void run(adminApi.setNoticeEnabled(n.id, !n.enabled), n.enabled ? "Notice turned off." : "Notice turned on.")}>{n.enabled ? "Turn off" : "Turn on"}</button>
                    <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => { if (window.confirm("Delete this notice?")) void run(adminApi.removeNotice(n.id), "Notice deleted."); }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

/** Frequently asked questions shown at the bottom of the homepage (and reached from the FAQ button in the navbar). */
function FaqEditor() {
  const faqs = useAdminFaqs();
  const { showToast } = useUI();
  const [draft, setDraft] = useState({ question: "", answer: "" });
  const [editing, setEditing] = useState<{ id: number; question: string; answer: string } | null>(null);
  const [msg, setMsg] = useState("");

  const run = async (p: Promise<{ ok: boolean; error?: string }>, done?: string) => {
    const res = await p;
    if (!res.ok) { setMsg(res.error ?? "Something went wrong."); return false; }
    setMsg("");
    if (done) showToast(done);
    return true;
  };
  const add = () => void run(adminApi.addFaq(draft.question, draft.answer), "Question added.").then((ok) => ok && setDraft({ question: "", answer: "" }));
  const small = { fontSize: ".75rem" } as const;

  return (
    <Panel title="FAQ" subtitle={`Questions and answers shown as a drop-down list at the bottom of the homepage. ${faqs.filter((f) => f.enabled).length} showing now.`}>
      <div className="admin-field">
        <label htmlFor="faqQ">New question</label>
        <input id="faqQ" type="text" maxLength={200} placeholder="e.g. How long does delivery take?" style={inputStyle} value={draft.question} onChange={(e) => { setDraft({ ...draft, question: e.target.value }); setMsg(""); }} />
      </div>
      <div className="admin-field">
        <label htmlFor="faqA">Answer</label>
        <textarea id="faqA" rows={3} maxLength={2000} style={{ ...inputStyle, minHeight: 84 }} value={draft.answer} onChange={(e) => { setDraft({ ...draft, answer: e.target.value }); setMsg(""); }} />
      </div>
      <div style={{ display: "flex", gap: ".6rem", margin: ".4rem 0 .2rem" }}>
        <button className="admin-btn primary" type="button" disabled={!draft.question.trim() || !draft.answer.trim()} onClick={add}>Add question</button>
      </div>
      <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".6rem" }}>{msg}</p>

      <table className="admin-table">
        <thead><tr><th>Question &amp; answer</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {!faqs.length && emptyRow(3, "No questions yet. The FAQ section stays hidden until you add one.")}
          {faqs.map((f, i) => (
            <tr key={f.id}>
              <td style={{ maxWidth: 440 }}>
                {editing?.id === f.id ? (
                  <div style={{ display: "grid", gap: ".5rem" }}>
                    <input aria-label="Edit question" type="text" maxLength={200} style={inputStyle} value={editing.question} autoFocus onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
                    <textarea aria-label="Edit answer" rows={3} maxLength={2000} style={{ ...inputStyle, minHeight: 76 }} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
                  </div>
                ) : (
                  <div style={{ opacity: f.enabled ? 1 : 0.55 }}>
                    <strong style={{ fontSize: ".88rem" }}>{f.question}</strong>
                    <p style={{ margin: ".2rem 0 0", fontSize: ".8rem", color: "var(--muted)" }}>{f.answer.length > 140 ? `${f.answer.slice(0, 140)}…` : f.answer}</p>
                  </div>
                )}
              </td>
              <td><span className={`pill ${f.enabled ? "live" : "off"}`}>{f.enabled ? "Showing" : "Hidden"}</span></td>
              <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                {editing?.id === f.id ? (
                  <>
                    <button className="admin-btn primary" style={small} type="button" onClick={() => void run(adminApi.editFaq(f.id, { question: editing.question, answer: editing.answer }), "Question updated.").then((ok) => ok && setEditing(null))}>Save</button>
                    <button className="admin-btn" style={small} type="button" onClick={() => { setEditing(null); setMsg(""); }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="admin-btn" style={small} type="button" aria-label="Move up" disabled={i === 0} onClick={() => void run(adminApi.editFaq(f.id, { move: "up" }))}>↑</button>
                    <button className="admin-btn" style={small} type="button" aria-label="Move down" disabled={i === faqs.length - 1} onClick={() => void run(adminApi.editFaq(f.id, { move: "down" }))}>↓</button>
                    <button className="admin-btn" style={{ ...small, color: "var(--rose-deep)" }} type="button" onClick={() => { setEditing({ id: f.id, question: f.question, answer: f.answer }); setMsg(""); }}>Edit</button>
                    <button className="admin-btn" style={small} type="button" onClick={() => void run(adminApi.editFaq(f.id, { enabled: !f.enabled }), f.enabled ? "Question hidden." : "Question showing.")}>{f.enabled ? "Hide" : "Show"}</button>
                    <button className="admin-btn danger" style={small} type="button" onClick={() => { if (window.confirm("Delete this question?")) void run(adminApi.removeFaq(f.id), "Question deleted."); }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function ContentPanel() {
  return (
    <>
      <NoticeEditor />
      <div style={{ height: "1.25rem" }} />
      <CategoryEditor />
      <div style={{ height: "1.25rem" }} />
      <FaqEditor />
    </>
  );
}
