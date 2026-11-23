"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  useAdminOverview, useCatalogOverrides, useCoupons, useCustomers, useInventoryRecords, useLoginHistory, useManagers, useOrders,
} from "@/hooks/useServices";
import { useUI } from "@/components/providers/UIProvider";
import { Modal, Panel, emptyRow, inputStyle } from "./shared";
import { OrderDetailModal } from "./OrdersPanel";
import {
  activeVolumes, applyToProduct, effectiveSprays, formatSprays, fullBottleFor, fullBottleLive, fullBottleOf,
  sectionReplacedByFullBottle, suggestSprays,
} from "@/lib/services/catalogOverrides";
import { GIFTS, OILS, PRODUCTS } from "@/lib/data/catalog";
import { DEFAULT_SPRAYS } from "@/lib/config";
import { adminApi, catalogOverridesApi } from "@/lib/api/admin";
import { ADMIN_SECTIONS } from "@/lib/services/admin";
import { formatDate, formatDateTime, money } from "@/lib/format";
import type { CatalogOverrides, InventoryKind, InventoryRecord, ManagerPermissions, Order, Product, PublicManager } from "@/types";

/* ───────────────────────── Overview ───────────────────────── */
export const STATUSES: Order["status"][] = ["received", "confirmed", "shipped", "delivered", "cancelled"];

export function OverviewPanel() {
  const ov = useAdminOverview();
  const { orders } = useOrders(1, 6);
  const history = ov?.recentSignIns ?? [];
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = orders.find((o) => o.id === viewingId) ?? null;

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat"><span>Live products</span><strong>{ov?.liveProducts ?? "—"}</strong><small>Visible now</small></div>
        <div className="admin-stat"><span>Total orders</span><strong>{ov?.orders ?? "—"}</strong><small>Recorded so far</small></div>
        <div className="admin-stat"><span>Shipments</span><strong>{ov?.shipped ?? "—"}</strong><small>{ov?.inTransit ?? 0} unit(s) in transit</small></div>
        <div className="admin-stat"><span>Customers</span><strong>{ov?.customers ?? "—"}</strong><small>Registered accounts</small></div>
      </div>

      <Panel title="Recent order activity" subtitle="Last orders placed through the storefront. Update status as they progress.">
        {!orders.length && <p style={{ color: "var(--muted)", fontSize: ".84rem", padding: ".5rem" }}>No orders placed yet.</p>}
        <div style={{ display: "grid", gap: ".5rem", padding: ".5rem 0" }}>
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: ".75rem", alignItems: "center", padding: ".8rem", borderRadius: ".85rem", background: "#f7f0ec" }}>
              <div>
                <strong style={{ display: "block", fontSize: ".88rem" }}>{o.id}</strong>
                <small style={{ color: "var(--muted)", fontSize: ".75rem" }}>{o.customer.name || "—"} · {o.transaction.type || "—"} · {formatDateTime(o.placedAt)}</small>
              </div>
              <button className="admin-btn" type="button" style={{ fontSize: ".75rem" }} onClick={() => setViewingId(o.id)}>Details</button>
              <select aria-label={`Status of ${o.id}`} value={o.status} onChange={(e) => void adminApi.setOrderStatus(o.id, e.target.value as Order["status"])} style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".3rem .6rem", fontSize: ".78rem", textTransform: "capitalize" }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ color: "var(--rose-deep)", fontSize: ".86rem", fontWeight: 800 }}>{money(o.grandTotal)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <OrderDetailModal order={viewing} onClose={() => setViewingId(null)} />
      <div style={{ height: "1.25rem" }} />
      <Panel title="Recent sign-ins" subtitle="Latest customer and staff activity.">
        {!history.length && <p style={{ color: "var(--muted)", fontSize: ".84rem", padding: ".5rem" }}>No activity yet.</p>}
        {history.slice(0, 5).map((h) => (
          <p key={h.ts + h.user} style={{ margin: ".35rem 0", fontSize: ".84rem" }}>
            <span className={`hist-type ${h.type === "manager" ? "mgr" : h.type === "owner" ? "owner" : "cust"}`}>{h.type}</span>{" "}
            {h.user} — {h.action} <span className="hist-time">· {formatDateTime(h.ts)}</span>
          </p>
        ))}
      </Panel>
    </>
  );
}

/* ───────────────────────── Inventory ───────────────────────── */
/** Stock editor: ml for perfume decants/oils (one total per perfume), pieces for gift sets. Type an exact amount or use the steps. */
function StockCell({ r }: { r: InventoryRecord }) {
  const ml = r.unit === "ml";
  const step = ml ? 100 : 1;
  const [val, setVal] = useState(String(r.stock));
  useEffect(() => { setVal(String(r.stock)); }, [r.stock]);
  const commit = () => {
    const n = Number(val);
    if (val.trim() === "" || !Number.isInteger(n) || n < 0) { setVal(String(r.stock)); return; }
    if (n !== r.stock) void adminApi.patchInventory(r.id, { stockSet: n });
  };
  const stepper = { width: 30, height: 30, border: 0, borderRadius: ".45rem", color: "var(--rose-deep)", background: "#f8eff1", fontWeight: 700, fontSize: "1rem", cursor: "pointer" } as const;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: ".25rem", padding: ".18rem", border: "1px solid var(--line)", borderRadius: ".65rem", background: "#fff" }}>
      <button style={stepper} type="button" aria-label={`Decrease stock of ${r.name} by ${step} ${r.unit}`} disabled={r.stock <= 0} onClick={() => void adminApi.patchInventory(r.id, { stockDelta: -step })}>−</button>
      <input aria-label={`Stock of ${r.name} in ${r.unit}`} inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        style={{ width: ml ? 64 : 44, border: 0, textAlign: "center", fontSize: ".85rem", fontWeight: 800, background: "transparent", outline: "none" }} />
      <span style={{ fontSize: ".72rem", color: "var(--muted)", marginRight: ".15rem" }}>{r.unit}</span>
      <button style={stepper} type="button" aria-label={`Increase stock of ${r.name} by ${step} ${r.unit}`} onClick={() => void adminApi.patchInventory(r.id, { stockDelta: step })}>+</button>
    </div>
  );
}

export function InventoryPanel() {
  const records = useInventoryRecords();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Perfume decant" as InventoryKind, sizes: "3–100 ml", price: "", stock: "" });
  const [msg, setMsg] = useState("");

  const act = (r: InventoryRecord, a: "enabled" | "visible" | "archive" | "restore") => {
    if (a === "enabled") void adminApi.patchInventory(r.id, { enabled: !r.enabled });
    if (a === "visible") void adminApi.patchInventory(r.id, { visible: !r.visible });
    if (a === "archive") void adminApi.patchInventory(r.id, { removed: true });
    if (a === "restore") void adminApi.patchInventory(r.id, { removed: false, enabled: true, visible: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !(price >= 0) || !(stock >= 0) || form.price === "" || form.stock === "") { setMsg("Please fill in all fields correctly."); return; }
    const res = await adminApi.addInventory({ name: form.name.trim(), type: form.type, sizes: form.sizes.trim(), price, stock });
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    setForm({ name: "", type: "Perfume decant", sizes: "3–100 ml", price: "", stock: "" });
    setMsg("");
    setOpen(false);
  };

  const btn = { fontSize: ".75rem" } as const;
  const stepper = { width: 30, height: 30, border: 0, borderRadius: ".45rem", color: "var(--rose-deep)", background: "#f8eff1", fontWeight: 700, fontSize: "1rem" } as const;

  return (
    <>
      <Panel title="Inventory control" subtitle="Perfume decants and oils are stocked in ml: set the total once and every order takes its size out of it. Gift sets are counted in pieces." action={<button className="admin-btn primary" type="button" onClick={() => setOpen(true)}>Add inventory</button>}>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Sizes</th><th>Stock</th><th>Sold</th><th>State</th><th>Actions</th></tr></thead>
          <tbody>
            {!records.length && emptyRow(6, "No inventory records. Add one to start.")}
            {records.map((r) => {
              const live = r.enabled && r.visible && !r.removed;
              return (
                <tr key={r.id}>
                  <td><strong style={{ display: "block", fontSize: ".9rem" }}>{r.name}</strong><small style={{ color: "var(--muted)", fontSize: ".73rem" }}>{r.type} · From ৳{r.price}</small></td>
                  <td>{r.sizes || "—"}</td>
                  <td><StockCell r={r} /></td>
                  <td>{r.ordered} {r.unit}<small style={{ display: "block", color: "var(--muted)", fontSize: ".72rem" }}>{r.inTransit} {r.unit} on way</small></td>
                  <td>{live ? <span className="pill live">Live</span> : <span className="pill off">{r.removed ? "Archived" : "Off"}</span>}</td>
                  <td style={{ whiteSpace: "nowrap", display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    {r.removed ? (
                      <button className="admin-btn" style={btn} type="button" onClick={() => act(r, "restore")}>Restore</button>
                    ) : (
                      <>
                        <button className="admin-btn" style={{ ...btn, color: "var(--rose-deep)" }} type="button" onClick={() => act(r, "enabled")}>{r.enabled ? "Disable" : "Enable"}</button>
                        <button className="admin-btn" style={btn} type="button" onClick={() => act(r, "visible")}>{r.visible ? "Hide" : "Show"}</button>
                        <button className="admin-btn danger" style={btn} type="button" onClick={() => act(r, "archive")}>Archive</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Modal open={open} onClose={() => { setOpen(false); setMsg(""); }} title="Add inventory record" subtitle="Add a new stock entry that the storefront will respect.">
        <form className="mgr-form" onSubmit={submit} noValidate>
          <div className="admin-field"><label htmlFor="invName">Product name</label><input id="invName" type="text" maxLength={62} placeholder="e.g. Rose Water Roll-On" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            <div className="admin-field"><label htmlFor="invType">Type</label>
              <select id="invType" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InventoryKind })}>
                {(["Perfume decant", "Perfume oil", "Gift set", "Custom bottle"] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-field"><label htmlFor="invSizes">Sizes</label><input id="invSizes" type="text" placeholder="e.g. 3–100 ml" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></div>
            <div className="admin-field"><label htmlFor="invPrice">Price (৳)</label><input id="invPrice" type="number" min={0} step={1} inputMode="numeric" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="admin-field"><label htmlFor="invStock">Opening stock ({form.type === "Perfume decant" || form.type === "Perfume oil" ? "total ml" : "pieces"})</label><input id="invStock" type="number" min={0} max={1000000} step={1} inputMode="numeric" placeholder={form.type === "Perfume decant" || form.type === "Perfume oil" ? "e.g. 500" : "0"} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <div className="mgr-modal-actions">
            <button className="admin-btn" type="button" onClick={() => { setOpen(false); setMsg(""); }}>Cancel</button>
            <button className="admin-btn primary" type="submit">Save record</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/* ───────────────────────── Customers ───────────────────────── */
export function CustomersPanel() {
  const customers = useCustomers();
  return (
    <Panel title="Customer database" subtitle="Registered customer accounts and their basic details.">
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th><th>Last login</th></tr></thead>
        <tbody>
          {!customers.length && emptyRow(6, "No registered customers yet.")}
          {customers.map((c) => (
            <tr key={c.email}>
              <td>{c.name || "—"}</td><td>{c.email}</td><td>{c.phone || "—"}</td>
              <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address || "—"}</td>
              <td className="hist-time">{formatDate(c.joinedAt)}</td><td className="hist-time">{formatDate(c.lastLogin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────────────────────── Login history ───────────────────────── */
export function HistoryPanel() {
  const history = useLoginHistory();
  const cls = { customer: "cust", owner: "owner", manager: "mgr" } as const;
  return (
    <Panel title="Login history" subtitle="All sign-in events for customers, managers, and admin activities.">
      <table className="admin-table">
        <thead><tr><th>Time</th><th>Type</th><th>User</th><th>Action</th></tr></thead>
        <tbody>
          {!history.length && emptyRow(4, "No login history yet.")}
          {history.map((h, i) => (
            <tr key={h.ts + i}>
              <td className="hist-time">{formatDateTime(h.ts)}</td>
              <td><span className={`hist-type ${cls[h.type]}`}>{h.type}</span></td>
              <td>{h.user || "—"}</td><td>{h.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────────────────────── Coupons ───────────────────────── */
export function CouponsPanel() {
  const coupons = useCoupons();
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: "" });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const add = async () => {
    const res = await adminApi.addCoupon({ code: form.code, type: form.type, value: Number(form.value) });
    if (!res.ok) { setMsg({ text: res.error ?? "", ok: false }); return; }
    setForm({ ...form, code: "", value: "" });
    setMsg({ text: "Code added.", ok: true });
  };

  return (
    <Panel title="Discount codes" subtitle="Manage coupon codes customers can apply at checkout.">
      <div className="coupon-add-row">
        <div className="admin-field"><label htmlFor="newCouponCode">Code</label><input id="newCouponCode" type="text" placeholder="e.g. SAVE15" maxLength={20} style={inputStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
        <div className="admin-field"><label htmlFor="newCouponType">Type</label>
          <select id="newCouponType" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}>
            <option value="percent">Percent off (%)</option><option value="flat">Flat off (৳)</option>
          </select>
        </div>
        <div className="admin-field"><label htmlFor="newCouponValue">Value</label><input id="newCouponValue" type="number" min={1} placeholder="e.g. 10" style={{ ...inputStyle, width: 130 }} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
        <button className="admin-btn primary" type="button" style={{ alignSelf: "flex-end", height: 42 }} onClick={add}>Add code</button>
      </div>
      <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".8rem", color: msg?.ok ? "#446046" : "#a84d58" }}>{msg?.text}</p>
      <table className="admin-table">
        <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.code}>
              <td><span className="coupon-tag">{c.code}</span></td>
              <td>{c.type === "percent" ? "Percent" : "Flat"}</td>
              <td>{c.type === "percent" ? `${c.value}%` : `৳${c.value}`}</td>
              <td><span className={`pill ${c.active ? "live" : "off"}`}>{c.active ? "Active" : "Off"}</span></td>
              <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => void adminApi.toggleCoupon(c.code, !c.active)}>{c.active ? "Deactivate" : "Activate"}</button>
                <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => void adminApi.removeCoupon(c.code)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────────────────────── Managers ───────────────────────── */
const NO_PERMS: ManagerPermissions = { inventory: false, products: false, customers: false, history: false, coupons: false, content: false };
const DEFAULT_PERMS: ManagerPermissions = { inventory: true, products: false, customers: false, history: false, coupons: true, content: false };

export function ManagersPanel() {
  const managers = useManagers();
  const [editing, setEditing] = useState<PublicManager | "new" | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", permissions: DEFAULT_PERMS });
  const [msg, setMsg] = useState("");

  const open = (m: PublicManager | "new") => {
    setEditing(m);
    setMsg("");
    setForm(m === "new" ? { name: "", username: "", password: "", permissions: DEFAULT_PERMS } : { name: m.name, username: m.username, password: "", permissions: { ...NO_PERMS, ...m.permissions } });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await adminApi.saveManager({
      editId: editing && editing !== "new" ? editing.id : undefined,
      name: form.name, username: form.username, password: form.password, permissions: form.permissions,
    });
    if (!res.ok) { setMsg(res.error ?? ""); return; }
    setEditing(null);
  };

  const isEdit = editing !== null && editing !== "new";
  const tick = (p?: boolean) => <span className={`pill ${p ? "live" : "off"}`} style={{ fontSize: ".65rem" }}>{p ? "✓" : "✗"}</span>;

  return (
    <>
      <Panel title="Manager accounts" subtitle="Create named manager accounts and define which sections they can access." action={<button className="admin-btn primary" type="button" onClick={() => open("new")}>Add manager</button>}>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Username</th><th>Inventory</th><th>Prices</th><th>Customers</th><th>History</th><th>Coupons</th><th>Notice &amp; categories</th><th>Actions</th></tr></thead>
          <tbody>
            {!managers.length && emptyRow(9, "No manager accounts yet. Add one to get started.")}
            {managers.map((m) => (
              <tr key={m.id}>
                <td><strong style={{ fontSize: ".88rem" }}>{m.name}</strong></td>
                <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{m.username}</td>
                <td>{tick(m.permissions.inventory)}</td><td>{tick(m.permissions.products)}</td><td>{tick(m.permissions.customers)}</td>
                <td>{tick(m.permissions.history)}</td><td>{tick(m.permissions.coupons)}</td><td>{tick(m.permissions.content)}</td>
                <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                  <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => open(m)}>Edit</button>
                  <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => { if (window.confirm(`Remove ${m.name}? They are signed out immediately.`)) void adminApi.removeManager(m.id); }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Modal
        open={editing !== null} onClose={() => setEditing(null)}
        title={isEdit ? "Edit manager" : "Add manager"}
        subtitle={isEdit ? "Update this manager's name, username, password, or permissions. Leave password blank to keep it unchanged." : "Create a named manager account with custom permissions."}
      >
        <form className="mgr-form" onSubmit={submit} noValidate>
          <div className="admin-field"><label htmlFor="mgrName">Full name</label><input id="mgrName" type="text" placeholder="Manager name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="admin-field"><label htmlFor="mgrUser">Username</label><input id="mgrUser" type="text" autoComplete="off" placeholder="Login username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div className="admin-field"><label htmlFor="mgrPass">{isEdit ? "New password (leave blank to keep current)" : "Password"}</label><input id="mgrPass" type="password" autoComplete="new-password" placeholder="Set a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div style={{ border: "1px solid var(--line)", borderRadius: ".9rem", padding: ".9rem 1rem" }}>
            <div style={{ fontSize: ".83rem", fontWeight: 700, marginBottom: ".7rem" }}>Section access</div>
            <div className="perm-grid">
              {ADMIN_SECTIONS.map((s) => (
                <PermRow key={s.id} label={s.label} value={form.permissions[s.id]} onChange={(v) => setForm({ ...form, permissions: { ...form.permissions, [s.id]: v } })} />
              ))}
            </div>
          </div>
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <div className="mgr-modal-actions">
            <button className="admin-btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
            <button className="admin-btn primary" type="submit">Save manager</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PermRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const name = `perm_${label}`;
  return (
    <>
      <span className="perm-label">{label}</span>
      <label><input type="radio" name={name} checked={value} onChange={() => onChange(true)} /> Allow</label>
      <label><input type="radio" name={name} checked={!value} onChange={() => onChange(false)} /> Deny</label>
    </>
  );
}

/* ───────────────────────── Prices & sprays ───────────────────────── */
type Draft = Record<string, string>;
const draftOf = (vols: number[], values: Record<number, number | undefined>): Draft =>
  Object.fromEntries(vols.map((v) => [v, values[v] === undefined ? "" : String(values[v])]));
const sameDraft = (keys: (number | string)[], a: Draft, b: Draft) => keys.every((k) => (a[k] ?? "") === (b[k] ?? ""));
const num = (s: string | undefined) => (s === undefined || s.trim() === "" ? NaN : Number(s));
const numInput = { ...inputStyle, width: 88, minHeight: 38, padding: ".45rem .55rem", textAlign: "right" as const };
const editedPill = <span className="pill live" style={{ marginLeft: ".4rem" }}>Edited</span>;

/**
 * Admin control of the volume sections customers can choose (add / delete), the spray count of each,
 * every perfume's price per volume (blank = not offered), and oil / gift-set prices.
 * Changes apply immediately to the storefront, product pop-up, filters, search, cart and checkout.
 */
export function PricingPanel() {
  const overrides = useCatalogOverrides();
  const { showToast } = useUI();
  const volumes = activeVolumes(overrides);
  const sprays = effectiveSprays(overrides);
  const volKey = volumes.join(",");
  const customised = !!overrides.volumes || Object.keys(overrides.sprays).length > 0;

  /* spray drafts */
  const savedSprays = draftOf(volumes, sprays);
  const [sprayDraft, setSprayDraft] = useState<Draft>(savedSprays);
  const [sprayMsg, setSprayMsg] = useState("");
  const sprayKey = volKey + JSON.stringify(overrides.sprays);
  useEffect(() => { setSprayDraft(draftOf(activeVolumes(overrides), effectiveSprays(overrides))); setSprayMsg(""); }, [sprayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const spraysDirty = !sameDraft(volumes, sprayDraft, savedSprays);

  /* add-volume form */
  const [newMl, setNewMl] = useState("");
  const [newSprays, setNewSprays] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [spraysTouched, setSpraysTouched] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  /** Which perfume's customer view the tiles show (prices can differ per perfume). */
  const [previewId, setPreviewId] = useState<number>(PRODUCTS[0].id);
  /** Section prices as stored (ignoring Full bottle), so a section hidden by Full bottle still shows its prices here. */
  const sectionView: CatalogOverrides = { ...overrides, fullBottle: undefined };
  const replaced = sectionReplacedByFullBottle(overrides);
  const previewBase = PRODUCTS.find((p) => p.id === previewId) ?? PRODUCTS[0];
  const previewProduct = applyToProduct(previewBase, sectionView);
  const previewLive = applyToProduct(previewBase, overrides);

  /* Full bottle section */
  const fb = fullBottleOf(overrides);
  const fbLive = fullBottleLive(overrides);
  const fbSaved = { ml: String(fb.ml), sprays: String(fb.sprays), price: fb.price === null ? "" : String(fb.price) };
  const [fbDraft, setFbDraft] = useState(fbSaved);
  const [fbMsg, setFbMsg] = useState("");
  const fbKey = JSON.stringify(overrides.fullBottle ?? {});
  useEffect(() => { const f = fullBottleOf(overrides); setFbDraft({ ml: String(f.ml), sprays: String(f.sprays), price: f.price === null ? "" : String(f.price) }); setFbMsg(""); }, [fbKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const fbDirty = fbDraft.ml !== fbSaved.ml || fbDraft.sprays !== fbSaved.sprays || fbDraft.price !== fbSaved.price;
  const fbDraftMl = num(fbDraft.ml);
  const fbClash = Number.isInteger(fbDraftMl) && volumes.includes(fbDraftMl);
  const fbSoldFor = PRODUCTS.filter((p) => fullBottleFor(p, overrides)).length;

  /** Asks which section to keep when the Full bottle size equals an existing section. */
  const confirmClash = (ml: number) => window.confirm(
    `A ${ml} ml section already exists. A ${ml} ml full bottle is the same bottle, so customers can only be shown one of them.\n\n`
    + `OK — show "Full bottle" and hide the ${ml} ml section while Full bottle is ON.\n`
    + `Cancel — keep the ${ml} ml section (choose a different Full bottle size, or delete the ${ml} ml section).`,
  );
  const saveFullBottle = async (enabled: boolean) => {
    const ml = num(fbDraft.ml);
    const price = fbDraft.price.trim() === "" ? null : num(fbDraft.price);
    if (fbDraft.ml.trim() === "") { setFbMsg("Enter the full bottle size in ml."); return; }
    if (fbDraft.sprays.trim() === "") { setFbMsg("Enter the spray count."); return; }
    if (enabled && price === null) { setFbMsg("Set the full bottle price before switching it ON."); return; }
    const alreadyReplacing = fbLive && fb.ml === ml;
    if (enabled && volumes.includes(ml) && !alreadyReplacing && !confirmClash(ml)) { setFbMsg(`Kept the ${ml} ml section. Choose a different Full bottle size, or delete the ${ml} ml section first.`); return; }
    const res = await catalogOverridesApi.saveFullBottle({ enabled, ml, sprays: num(fbDraft.sprays), price });
    if (!res.ok) { setFbMsg(res.error ?? ""); return; }
    setFbMsg("");
    showToast(enabled ? `Full bottle is ON (${ml} ml).` : "Full bottle saved — it's OFF, so customers don't see it.");
  };
  const toggleFullBottle = async () => {
    if (fb.enabled) {
      const res = await catalogOverridesApi.saveFullBottle({ ...fb, enabled: false });
      if (!res.ok) { setFbMsg(res.error ?? ""); return; }
      showToast("Full bottle is OFF — hidden from customers.");
    } else {
      await saveFullBottle(true);
    }
  };

  const pricesAt = (v: number) => PRODUCTS.map((p) => applyToProduct(p, sectionView).prices[v]).filter((x): x is number => x !== undefined);
  const pricedCount = (v: number) => pricesAt(v).length;
  const priceSummary = (v: number) => {
    const ps = pricesAt(v);
    if (!ps.length) return "Not priced yet";
    const lo = Math.min(...ps), hi = Math.max(...ps);
    return lo === hi ? money(lo) : `${money(lo)} – ${money(hi)}`;
  };
  const goToPrices = (v: number) => {
    document.getElementById("perfume-prices")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.querySelector<HTMLInputElement>(`input[aria-label$=" ${v} ml price"]`)?.focus({ preventScroll: true }), 450);
  };

  const saveSprays = async () => {
    const res = await catalogOverridesApi.setSprays(Object.fromEntries(volumes.map((v) => [v, num(sprayDraft[v])])));
    if (!res.ok) { setSprayMsg(res.error ?? ""); return; }
    showToast("Spray counts saved.");
  };
  const addVolume = async (e: FormEvent) => {
    e.preventDefault();
    const ml = num(newMl);
    if (newMl.trim() === "") { setAddMsg("Enter the volume in ml."); return; }
    if (!Number.isInteger(ml) || ml < 1 || ml > 1000) { setAddMsg("Enter a whole number of ml between 1 and 1000."); return; }
    if (newSprays.trim() === "") { setAddMsg("Enter the spray count."); return; }
    if (newPrice.trim() === "") { setAddMsg("Enter the price for this section."); return; }
    const price = num(newPrice);
    const res = await catalogOverridesApi.addVolume(ml, num(newSprays), price);
    if (!res.ok) { setAddMsg(res.error ?? ""); return; }
    setNewMl(""); setNewSprays(""); setNewPrice(""); setSpraysTouched(false); setAddMsg("");
    showToast(`${ml} ml section added at ${money(price)}. It's now on sale for every perfume.`);
  };
  const removeVolume = async (v: number) => {
    if (!window.confirm(`Stop selling ${v} ml?\n\nIt disappears from the shop, and its prices and spray count are discarded. Bags that contain ${v} ml items will drop them.`)) return;
    const res = await catalogOverridesApi.removeVolume(v);
    if (!res.ok) { showToast(res.error ?? "Could not remove."); return; }
    showToast(`${v} ml removed from the shop.`);
  };
  const restoreDefaults = async () => {
    if (!window.confirm("Restore the default volumes (3, 6, 9, 15, 50, 100 ml), their spray counts and the original perfume prices?")) return;
    await catalogOverridesApi.resetVolumes();
    showToast("Default volumes, spray counts and prices restored.");
  };

  return (
    <>
      <Panel
        title="Volume sections"
        subtitle="Each section is one size customers can choose: its volume, spray count and price. Delete a section to stop selling that size; add one to start selling a new size."
        action={customised ? <button className="admin-btn" type="button" onClick={restoreDefaults}>Restore defaults</button> : undefined}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".6rem", marginBottom: ".4rem" }}>
          <label htmlFor="previewAs" style={{ fontSize: ".82rem", fontWeight: 700 }}>Customer view shown for</label>
          <select id="previewAs" style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".35rem .6rem" }} value={previewId} onChange={(e) => setPreviewId(Number(e.target.value))}>
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <small style={{ color: "var(--muted)" }}>Prices can differ per perfume — pick one to see exactly what its customers see.</small>
        </div>
        <table className="admin-table" style={{ minWidth: 860 }}>
          <thead><tr><th>Volume</th><th>Spray count</th><th>Price</th><th>Customer view</th><th>Sold for</th><th>Actions</th></tr></thead>
          <tbody>
            {volumes.map((v) => {
              const n = pricedCount(v);
              const draftSprays = num(sprayDraft[v]);
              return (
                <tr key={v}>
                  <td>
                    <strong style={{ fontSize: ".95rem" }}>{v} ml</strong>{DEFAULT_SPRAYS[v] === undefined && <span className="pill live" style={{ marginLeft: ".4rem" }}>Added</span>}
                    {v === replaced && <span className="pill off" style={{ display: "table", marginTop: ".3rem" }} title="Full bottle is ON with this size, so this section is hidden from customers. Switch Full bottle OFF to show it again.">Hidden — Full bottle is {v} ml</span>}
                  </td>
                  <td>
                    <input aria-label={`${v} ml spray count`} type="number" inputMode="numeric" min={1} step={1} style={numInput}
                      value={sprayDraft[v] ?? ""} onChange={(e) => { setSprayDraft({ ...sprayDraft, [v]: e.target.value }); setSprayMsg(""); }} />
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700, color: n ? "var(--rose-deep)" : "var(--muted)", fontSize: ".86rem" }}>
                    {priceSummary(v)}
                    {new Set(pricesAt(v)).size > 1 && <small style={{ display: "block", fontWeight: 500, color: "var(--muted)" }}>varies by perfume</small>}
                  </td>
                  <td>
                    {v === replaced
                      ? <CustomerTile ml={v} replaced />
                      : <CustomerTile ml={v} price={previewProduct.prices[v]} sprays={Number.isFinite(draftSprays) ? draftSprays : undefined} perfume={previewProduct.name} />}
                  </td>
                  <td>
                    {v === replaced
                      ? <span className="pill off">Hidden</span>
                      : <span className={`pill ${n ? "live" : "off"}`}>{n} of {PRODUCTS.length} perfumes</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => goToPrices(v)}>Set prices</button>
                      <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" disabled={volumes.length <= 1}
                        title={volumes.length <= 1 ? "At least one volume must stay on sale" : `Stop selling ${v} ml`} onClick={() => removeVolume(v)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginTop: ".9rem" }}>
          <button className="admin-btn primary" type="button" disabled={!spraysDirty} onClick={saveSprays}>Save spray counts</button>
          {spraysDirty && <button className="admin-btn" type="button" onClick={() => { setSprayDraft(savedSprays); setSprayMsg(""); }}>Cancel</button>}
        </div>
        <p className="admin-form-msg" aria-live="polite">{sprayMsg}</p>

        <form onSubmit={addVolume} noValidate style={{ marginTop: ".5rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: ".9rem", fontWeight: 700, marginBottom: ".6rem" }}>Add a section</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
            <div className="admin-field">
              <label htmlFor="newVolume">Volume (ml)</label>
              <input id="newVolume" type="number" inputMode="numeric" min={1} max={1000} step={1} placeholder="e.g. 20" style={numInput}
                value={newMl} onChange={(e) => {
                  setNewMl(e.target.value); setAddMsg("");
                  const ml = num(e.target.value);
                  if (!spraysTouched) setNewSprays(Number.isInteger(ml) && ml > 0 ? String(suggestSprays(ml)) : "");
                }} />
            </div>
            <div className="admin-field">
              <label htmlFor="newVolumeSprays">Spray count</label>
              <input id="newVolumeSprays" type="number" inputMode="numeric" min={1} step={1} placeholder="e.g. 300" style={{ ...numInput, width: 110 }}
                value={newSprays} onChange={(e) => { setNewSprays(e.target.value); setSpraysTouched(true); setAddMsg(""); }} />
            </div>
            <div className="admin-field">
              <label htmlFor="newVolumePrice">Price (৳)</label>
              <input id="newVolumePrice" type="number" inputMode="numeric" min={0} step={1} placeholder="e.g. 1200" style={{ ...numInput, width: 120 }}
                value={newPrice} onChange={(e) => { setNewPrice(e.target.value); setAddMsg(""); }} />
            </div>
            <div className="admin-field">
              <span style={{ fontSize: ".85rem" }}>Customers will see</span>
              <CustomerTile
                ml={Number.isFinite(num(newMl)) ? num(newMl) : undefined}
                price={Number.isFinite(num(newPrice)) ? num(newPrice) : undefined}
                sprays={Number.isFinite(num(newSprays)) ? num(newSprays) : undefined}
                draft
              />
            </div>
            <button className="admin-btn primary" type="submit" style={{ height: 40 }}>Add section</button>
          </div>
          <p className="admin-form-msg" aria-live="polite">{addMsg}</p>
          <small style={{ color: "var(--muted)" }}>The new section goes on sale for every perfume at this price. To charge a different price for a particular perfume, change it in “Perfume prices” below.</small>
        </form>
      </Panel>


      <div style={{ height: "1.25rem" }} />
      <div id="perfume-prices" style={{ scrollMarginTop: "6rem" }} />
      <Panel title="Perfume prices" subtitle="Price for each volume, in ৳. Leave a box empty to not offer that volume for that perfume. Edited prices apply everywhere, including bags customers have already filled.">
        <table className="admin-table">
          <thead><tr><th>Perfume</th>{volumes.map((v) => (
            <th key={v} style={{ textAlign: "right", opacity: v === replaced ? 0.55 : 1 }}>
              {v} ml
              <small style={{ display: "block", fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--muted)" }}>
                {v === replaced ? "hidden (Full bottle)" : sprays[v] !== undefined ? formatSprays(sprays[v]) : "—"}
              </small>
            </th>
          ))}{fbLive && (
            <th style={{ textAlign: "right" }}>
              Full bottle
              <small style={{ display: "block", fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--muted)" }}>{fb.ml} ml · {formatSprays(fb.sprays)}</small>
            </th>
          )}<th>Actions</th></tr></thead>
          <tbody>
            {PRODUCTS.map((p) => <PerfumePriceRow key={p.id} base={p} volumes={volumes} overrides={overrides} fullColumn={fbLive} />)}
          </tbody>
        </table>
      </Panel>

      <div style={{ height: "1.25rem" }} />
      <Panel title="Perfume oils & gift sets" subtitle="Single-price items.">
        <table className="admin-table">
          <thead><tr><th>Item</th><th>Type</th><th style={{ textAlign: "right" }}>Price (৳)</th><th>Actions</th></tr></thead>
          <tbody>
            {GIFTS.map((g) => <ItemPriceRow key={g.id} id={g.id} name={g.name} kind="Gift set" base={g.price} custom={overrides.itemPrices[g.id]} />)}
            {OILS.map((o) => <ItemPriceRow key={o.id} id={o.id} name={o.name} kind="Perfume oil · 6 ml" base={o.price} custom={overrides.itemPrices[o.id]} />)}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

/** A volume tile exactly as customers see it in the product pop-up ("Choose your volume"). */
function CustomerTile({ ml, price, sprays, perfume, draft, full, fullMl, replaced }: {
  ml?: number; price?: number; sprays?: number; perfume?: string; draft?: boolean;
  /** Render the "Full bottle" tile (its size goes on the small line). */ full?: boolean; fullMl?: number;
  /** A regular section hidden because Full bottle uses the same size. */ replaced?: boolean;
}) {
  const offered = price !== undefined;
  if (replaced) {
    return (
      <div className="size-option" aria-label={`Customer view: ${ml} ml hidden, replaced by Full bottle`} style={{ width: 132, minHeight: 74, cursor: "default", opacity: 0.55, borderStyle: "dashed" }}>
        <strong>{ml} ml</strong><span>Hidden</span><small className="size-option-sprays">shown as Full bottle</small>
      </div>
    );
  }
  if (full) {
    return (
      <div className="size-option" aria-label={`Customer view: Full bottle${offered ? `, ${money(price)}` : ""}, ${fullMl} ml${sprays !== undefined ? `, ${formatSprays(sprays)}` : ""}`}
        style={{ width: 150, minHeight: 74, cursor: "default", borderStyle: offered ? "solid" : "dashed" }}>
        <strong>Full bottle</strong>
        <span>{offered ? money(price) : "৳—"}</span>
        <small className="size-option-sprays">{fullMl ? `${fullMl} ml` : "— ml"} · {sprays !== undefined ? formatSprays(sprays) : "— sprays"}</small>
      </div>
    );
  }
  return (
    <div
      className="size-option"
      aria-label={ml ? `Customer view: ${ml} ml${offered ? `, ${money(price)}` : ", not sold"}${sprays !== undefined ? `, ${formatSprays(sprays)}` : ""}` : "Customer view preview"}
      title={!offered && perfume ? `${perfume} isn't sold in ${ml} ml — set a price in “Perfume prices”.` : undefined}
      style={{ width: 132, minHeight: 74, cursor: "default", opacity: offered || draft ? 1 : 0.55, borderStyle: offered ? "solid" : "dashed" }}
    >
      <strong>{ml ? `${ml} ml` : "— ml"}</strong>
      <span>{offered ? money(price) : draft ? "৳—" : "Not sold"}</span>
      {sprays !== undefined ? <small className="size-option-sprays">{formatSprays(sprays)}</small> : draft ? <small className="size-option-sprays">— sprays</small> : null}
    </div>
  );
}

function PerfumePriceRow({ base, volumes, overrides, fullColumn }: { base: Product; volumes: number[]; overrides: CatalogOverrides; fullColumn: boolean }) {
  const { showToast } = useUI();
  const sectionView: CatalogOverrides = { ...overrides, fullBottle: undefined };
  const effective = applyToProduct(base, sectionView);
  const live = applyToProduct(base, overrides);
  const fullKeys = fullColumn ? ["full"] : [];
  const withFull = (d: Draft): Draft => (fullColumn ? { ...d, full: live.fullBottle ? String(live.fullBottle.price) : "" } : d);
  const saved = withFull(draftOf(volumes, effective.prices));
  const [draft, setDraft] = useState<Draft>(saved);
  const [msg, setMsg] = useState("");
  const custom = overrides.prices[String(base.id)];
  const key = volumes.join(",") + JSON.stringify(custom ?? {});
  const fbKey = JSON.stringify(overrides.fullBottle ?? {}) + String(fullColumn);
  useEffect(() => { setDraft(saved); setMsg(""); }, [key, fbKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !sameDraft([...volumes, ...fullKeys], draft, saved);
  const edited = !!custom && Object.keys(custom).some((v) => volumes.includes(Number(v)) || (fullColumn && v === "full"));
  const hidden = Object.keys(live.prices).length === 0 && !live.fullBottle;

  const save = async () => {
    const full = fullColumn ? ((draft.full ?? "").trim() === "" ? null : num(draft.full)) : undefined;
    const res = await catalogOverridesApi.setProductPrices(base.id, Object.fromEntries(volumes.map((v) => [v, (draft[v] ?? "").trim() === "" ? null : num(draft[v])])), full);
    if (!res.ok) { setMsg(res.error ?? ""); return; }
    showToast(`${base.name} prices saved.`);
  };

  return (
    <tr>
      <td>
        <strong style={{ fontSize: ".9rem" }}>{base.name}</strong>{edited && editedPill}
        {hidden && <span className="pill off" style={{ marginLeft: ".4rem" }} title="No priced volume on sale — hidden from the shop">Hidden</span>}
        <small style={{ display: "block", color: "var(--muted)", fontSize: ".73rem" }}>{base.family}</small>
        {msg && <small style={{ display: "block", color: "#a84d58", fontWeight: 700, maxWidth: 260 }}>{msg}</small>}
      </td>
      {volumes.map((v) => (
        <td key={v} style={{ textAlign: "right" }}>
          <input
            aria-label={`${base.name} ${v} ml price`} type="number" inputMode="numeric" min={0} step={1} style={numInput} placeholder="—"
            title={base.prices[v] !== undefined ? `Default: ৳${base.prices[v]}. Empty = not offered.` : "New volume. Empty = not offered."}
            value={draft[v] ?? ""} onChange={(e) => { setDraft({ ...draft, [v]: e.target.value }); setMsg(""); }}
          />
        </td>
      ))}
      {fullColumn && (
        <td style={{ textAlign: "right" }}>
          <input
            aria-label={`${base.name} full bottle price`} type="number" inputMode="numeric" min={0} step={1} style={numInput} placeholder="—"
            title={`Full bottle section price: ৳${fullBottleOf(overrides).price}. Empty = no full bottle for this perfume.`}
            value={draft.full ?? ""} onChange={(e) => { setDraft({ ...draft, full: e.target.value }); setMsg(""); }}
          />
        </td>
      )}
      <td style={{ whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: ".4rem" }}>
          <button className="admin-btn primary" style={{ fontSize: ".75rem" }} type="button" disabled={!dirty} onClick={save}>Save</button>
          {dirty && <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => { setDraft(saved); setMsg(""); }}>Cancel</button>}
          {edited && !dirty && <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={async () => { await catalogOverridesApi.resetProductPrices(base.id); showToast(`${base.name} prices reset.`); }}>Reset</button>}
        </div>
      </td>
    </tr>
  );
}

function ItemPriceRow({ id, name, kind, base, custom }: { id: string; name: string; kind: string; base: number; custom?: number }) {
  const { showToast } = useUI();
  const saved = String(custom ?? base);
  const [draft, setDraft] = useState(saved);
  const [msg, setMsg] = useState("");
  useEffect(() => { setDraft(String(custom ?? base)); setMsg(""); }, [custom, base]);
  const dirty = draft !== saved;

  const save = async () => {
    const res = await catalogOverridesApi.setItemPrice(id, draft.trim() === "" ? NaN : Number(draft));
    if (!res.ok) { setMsg(res.error ?? ""); return; }
    showToast(`${name} price saved.`);
  };

  return (
    <tr>
      <td>
        <strong style={{ fontSize: ".9rem" }}>{name}</strong>{custom !== undefined && editedPill}
        {msg && <small style={{ display: "block", color: "#a84d58", fontWeight: 700 }}>{msg}</small>}
      </td>
      <td style={{ color: "var(--muted)", fontSize: ".82rem" }}>{kind}</td>
      <td style={{ textAlign: "right" }}>
        <input aria-label={`${name} price`} type="number" inputMode="numeric" min={0} step={1} style={numInput} title={`Default: ৳${base}`}
          value={draft} onChange={(e) => { setDraft(e.target.value); setMsg(""); }} />
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: ".4rem" }}>
          <button className="admin-btn primary" style={{ fontSize: ".75rem" }} type="button" disabled={!dirty} onClick={save}>Save</button>
          {dirty && <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => { setDraft(saved); setMsg(""); }}>Cancel</button>}
          {custom !== undefined && !dirty && <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={async () => { await catalogOverridesApi.resetItemPrice(id); showToast(`${name} price reset.`); }}>Reset</button>}
        </div>
      </td>
    </tr>
  );
}
