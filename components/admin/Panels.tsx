"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  useAdminCategories, useAdminMe, useAdminOverview, useCatalog, useCatalogOverrides, useCoupons, useCustomers, useInventoryRecords, useLoginHistory, useManagers, useOrders, useProductDetails, useSales,
} from "@/hooks/useServices";
import { ItemEditor, PerfumeEditor } from "./ProductEditor";
import { useUI } from "@/components/providers/UIProvider";
import { Modal, Panel, emptyRow, inputStyle } from "./shared";
import { OrderDetailModal } from "./OrdersPanel";
import {
  activeVolumes, applyToProduct, effectiveSprays, perfumesOf, formatSprays,
  sectionReplacedByFullBottle, suggestSprays,
} from "@/lib/services/catalogOverrides";
import { PRODUCTS } from "@/lib/data/catalog";
import { DEFAULT_SPRAYS } from "@/lib/config";
import { adminApi, catalogOverridesApi } from "@/lib/api/admin";
import { ADMIN_SECTIONS, can } from "@/lib/services/admin";
import { formatDate, formatDateTime, money } from "@/lib/format";
import type { CatalogOverrides, InventoryKind, InventoryRecord, ManagerPermissions, Order, PublicManager } from "@/types";
import { PasswordInput } from "@/components/ui/PasswordInput";

/* ───────────────────────── Overview ───────────────────────── */
export const STATUSES: Order["status"][] = ["received", "confirmed", "shipped", "delivered", "cancelled"];

export function OverviewPanel({ canSee }: { canSee: (s: "orders" | "history") => boolean }) {
  const ov = useAdminOverview();
  const history = ov?.recentSignIns ?? [];

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat"><span>Live products</span><strong>{ov?.liveProducts ?? "—"}</strong><small>Visible now</small></div>
        <div className="admin-stat"><span>Total orders</span><strong>{ov?.orders ?? "—"}</strong><small>Recorded so far</small></div>
        <div className="admin-stat"><span>Shipments</span><strong>{ov?.shipped ?? "—"}</strong><small>{ov?.openOrders ?? 0} open order{ov?.openOrders === 1 ? "" : "s"} not yet delivered</small></div>
        <div className="admin-stat"><span>Customers</span><strong>{ov?.customers ?? "—"}</strong><small>Registered accounts</small></div>
      </div>

      {canSee("orders") && <><RecentOrders /><div style={{ height: "1.25rem" }} /></>}
      {canSee("history") && <Panel title="Recent sign-ins" subtitle="Latest customer and staff activity.">
        {!history.length && <p style={{ color: "var(--muted)", fontSize: ".84rem", padding: ".5rem" }}>No activity yet.</p>}
        {history.slice(0, 5).map((h) => (
          <p key={h.ts + h.user} style={{ margin: ".35rem 0", fontSize: ".84rem" }}>
            <span className={`hist-type ${h.type === "manager" ? "mgr" : h.type === "owner" ? "owner" : "cust"}`}>{h.type}</span>{" "}
            {h.user} — {h.action} <span className="hist-time">· {formatDateTime(h.ts)}</span>
          </p>
        ))}
      </Panel>}
    </>
  );
}

/** Latest orders with quick status changes (staff with the Orders permission only). */
function RecentOrders() {
  const { orders } = useOrders(1, 6);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = orders.find((o) => o.id === viewingId) ?? null;
  return (
    <>
      <Panel title="Recent order activity" subtitle="Last orders placed through the storefront. Update status as they progress.">
        {!orders.length && <p style={{ color: "var(--muted)", fontSize: ".84rem", padding: ".5rem" }}>No orders placed yet.</p>}
        <div style={{ display: "grid", gap: ".5rem", padding: ".5rem 0" }}>
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: ".75rem", alignItems: "center", padding: ".8rem", borderRadius: ".85rem", background: "#f7f0ec" }}>
              <div>
                <strong style={{ display: "block", fontSize: ".88rem" }}>{o.id}</strong>
                <small style={{ color: "var(--muted)", fontSize: ".75rem" }}>{o.customer.name || "—"} · {o.transaction.type || "—"} · {formatDateTime(o.placedAt)}</small>
              </div>
              <button className="admin-btn" type="button" style={{ fontSize: ".75rem" }} onClick={() => setViewingId(o.id)}>View details</button>
              <select aria-label={`Status of ${o.id}`} value={o.status} onChange={(e) => void adminApi.setOrderStatus(o.id, e.target.value as Order["status"])} style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".3rem .6rem", fontSize: ".78rem", textTransform: "capitalize" }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ color: "var(--rose-deep)", fontSize: ".86rem", fontWeight: 800 }}>{money(o.grandTotal)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <OrderDetailModal order={viewing} onClose={() => setViewingId(null)} />
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
  const { showToast } = useUI();
  const canEdit = can(useAdminMe().session, "products");
  const perfumes = useProductDetails();
  const items = useCatalogOverrides().items;
  /** The product whose full form is open (its shop id), and whether it was just added (step 2 of Add product). */
  const [editing, setEditing] = useState<{ id: string; isNew: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Perfume decant" as InventoryKind, sizes: "", price: "", stock: "" });
  const perfume = form.type === "Perfume decant";
  const [msg, setMsg] = useState("");

  const act = (r: InventoryRecord, a: "enabled" | "visible" | "archive" | "restore") => {
    if (a === "enabled") void adminApi.patchInventory(r.id, { enabled: !r.enabled });
    if (a === "visible") void adminApi.patchInventory(r.id, { visible: !r.visible });
    if (a === "archive") void adminApi.patchInventory(r.id, { removed: true });
    if (a === "restore") void adminApi.patchInventory(r.id, { removed: false, enabled: true, visible: true });
  };
  const remove = async (r: InventoryRecord) => {
    if (!window.confirm(`Delete “${r.name}” for good? It disappears from the shop and admin with its photos and sales. Past orders keep their copy. This cannot be undone.`)) return;
    const res = await adminApi.deleteInventory(r.id);
    showToast(res.ok ? `${r.name} deleted.` : res.error ?? "Could not delete.");
  };
  /** Perfumes still missing the parameters customers compare on (brand, audience, strength). */
  const incomplete = new Set(perfumes.filter((p) => !p.brand || !p.audience || !p.strength).map((p) => String(p.id)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !(stock >= 0) || form.stock === "" || (!perfume && (form.price === "" || !(price >= 0)))) { setMsg("Please fill in all fields correctly."); return; }
    const res = await adminApi.addInventory({ name: form.name.trim(), type: form.type, sizes: form.sizes.trim(), price: perfume ? 0 : price, stock });
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    const shopId = (res.data as InventoryRecord | undefined)?.storefrontId;
    showToast(form.type === "Custom bottle" ? `${form.name.trim()} added to stock.` : `${form.name.trim()} added.`);
    setForm({ name: "", type: "Perfume decant", sizes: "", price: "", stock: "" });
    setMsg("");
    setOpen(false);
    if (shopId && form.type !== "Custom bottle" && canEdit) setEditing({ id: shopId, isNew: true }); // custom bottles have no shop page
  };

  const btn = { fontSize: ".75rem" } as const;

  return (
    <>
      <Panel title="Inventory control" subtitle="Perfume decants and oils are stocked in ml: set the total once and every order takes its size out of it. Gift sets are counted in pieces." action={<button className="admin-btn primary" type="button" onClick={() => setOpen(true)}>Add product</button>}>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Sizes</th><th>Stock</th><th>Sold</th><th>State</th><th>Actions</th></tr></thead>
          <tbody>
            {!records.length && emptyRow(6, "No inventory records. Add one to start.")}
            {records.map((r) => {
              const live = r.enabled && r.visible && !r.removed;
              return (
                <tr key={r.id}>
                  <td><strong style={{ display: "block", fontSize: ".9rem" }}>{r.name}</strong><small style={{ color: "var(--muted)", fontSize: ".73rem" }}>{r.type} · From ৳{r.price}</small>{r.storefrontId && incomplete.has(r.storefrontId) && !r.removed && <small style={{ display: "block", color: "var(--deal)", fontSize: ".72rem", fontWeight: 700 }}>Details missing: brand, audience or strength</small>}</td>
                  <td>{r.sizes || "—"}</td>
                  <td><StockCell r={r} /></td>
                  <td>{r.ordered} {r.unit}<small style={{ display: "block", color: "var(--muted)", fontSize: ".72rem" }}>{r.inTransit} {r.unit} on way</small></td>
                  <td>{r.removed ? <span className="pill off">Archived</span> : !r.storefrontId ? <span className="pill off" title="Not sold in the shop">Stock only</span> : live ? <span className="pill live">Live</span> : <span className="pill off">Off</span>}</td>
                  <td style={{ whiteSpace: "nowrap", display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    {r.removed ? (
                      <>
                        <button className="admin-btn" style={btn} type="button" onClick={() => act(r, "restore")}>Restore</button>
                        <button className="admin-btn danger" style={btn} type="button" onClick={() => void remove(r)}>Delete</button>
                      </>
                    ) : (
                      <>
                        {canEdit && r.storefrontId && <button className="admin-btn primary" style={btn} type="button" onClick={() => setEditing({ id: r.storefrontId!, isNew: false })}>Edit</button>}
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

      <Modal open={open} onClose={() => { setOpen(false); setMsg(""); }} title="Add a product" subtitle="Perfumes, oils and gift sets appear in the shop and in every admin table. Custom bottles are stock only.">
        <form className="mgr-form" onSubmit={submit} noValidate>
          <div className="admin-field"><label htmlFor="invName">Product name</label><input id="invName" type="text" maxLength={62} placeholder="e.g. Rose Water Roll-On" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            <div className="admin-field"><label htmlFor="invType">Type</label>
              <select id="invType" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as InventoryKind })}>
                {(["Perfume decant", "Perfume oil", "Gift set", "Custom bottle"] as const).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            {!perfume && <div className="admin-field"><label htmlFor="invPrice">Price (৳)</label><input id="invPrice" type="number" min={0} step={1} inputMode="numeric" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>}
            {form.type === "Custom bottle" && <div className="admin-field"><label htmlFor="invSizes">Sizes</label><input id="invSizes" type="text" placeholder="e.g. 50 ml" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} /></div>}
            <div className="admin-field"><label htmlFor="invStock">Opening stock ({form.type === "Perfume decant" || form.type === "Perfume oil" ? "total ml" : "pieces"})</label><input id="invStock" type="number" min={0} max={1000000} step={1} inputMode="numeric" placeholder={form.type === "Perfume decant" || form.type === "Perfume oil" ? "e.g. 500" : "0"} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          {perfume && <small style={{ color: "var(--muted)" }}>Next you’ll add photos, brand, family, strength, notes and price per size, all in one form.</small>}
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <div className="mgr-modal-actions">
            <button className="admin-btn" type="button" onClick={() => { setOpen(false); setMsg(""); }}>Cancel</button>
            <button className="admin-btn primary" type="submit">{form.type === "Custom bottle" ? "Add" : "Next"}</button>
          </div>
        </form>
      </Modal>

      {editing && (() => {
        const p = perfumes.find((x) => String(x.id) === editing.id);
        const oil = items?.oils.find((x) => x.id === editing.id);
        const gift = items?.gifts.find((x) => x.id === editing.id);
        const name = p?.name ?? oil?.name ?? gift?.name ?? "";
        const close = () => setEditing(null);
        return (
          <Modal open wide={!!p} onClose={close} title={editing.isNew ? `Describe ${name}` : `Edit ${name}`}
            subtitle={editing.isNew ? "Step 2 of 2: what customers see. It goes on sale once it has a price and stock." : "Everything customers see for this product. Stock is changed in the table."}>
            {p ? <PerfumeEditor p={p} onClose={close} />
              : oil || gift ? <ItemEditor item={(oil ?? gift)!} onClose={close} />
              : <p style={{ color: "var(--muted)" }}>Loading…</p>}
          </Modal>
        );
      })()}
    </>
  );
}

/* ───────────────────────── Customers ───────────────────────── */
export function CustomersPanel() {
  const customers = useCustomers();
  const { showToast } = useUI();
  const [pwFor, setPwFor] = useState<{ id: string; name: string } | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const remove = async (c: { id?: string; name: string; email: string }) => {
    if (!c.id || !window.confirm(`Delete the account of ${c.name || c.email}? Their orders stay; the account cannot be restored.`)) return;
    const res = await adminApi.deleteCustomer(c.id);
    showToast(res.ok ? "Customer deleted." : res.error ?? "Could not delete.");
  };
  const savePw = async (e: FormEvent) => {
    e.preventDefault();
    if (!pwFor) return;
    const res = await adminApi.setCustomerPassword(pwFor.id, pw);
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    showToast(`New password set for ${pwFor.name}. Send it to them privately.`);
    setPwFor(null); setPw(""); setMsg("");
  };
  return (
    <Panel title="Customer database" subtitle="Registered customer accounts and their basic details. Forgot-password requests come in on WhatsApp: check it is the account's phone number, then set a new password here." action={<a className="admin-btn" href="/api/admin/customers?format=csv" download>Download CSV</a>}>
      <table className="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th><th>Last login</th><th>Actions</th></tr></thead>
        <tbody>
          {!customers.length && emptyRow(7, "No registered customers yet.")}
          {customers.map((c) => (
            <tr key={c.email}>
              <td>{c.name || "—"}</td><td>{c.email}</td><td>{c.phone || "—"}</td>
              <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[c.address, c.city].filter(Boolean).join(", ") || "—"}</td>
              <td className="hist-time">{formatDate(c.joinedAt)}</td><td className="hist-time">{formatDate(c.lastLogin)}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="admin-btn" style={{ fontSize: ".75rem" }} type="button" onClick={() => { setPwFor({ id: c.id!, name: c.name || c.email }); setPw(""); setMsg(""); }}>Set new password</button>{" "}
                <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => void remove(c)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={!!pwFor} onClose={() => setPwFor(null)} title={`New password for ${pwFor?.name ?? ""}`} subtitle="They are signed out everywhere and sign in with this password. At least 8 characters with letters and numbers.">
        <form className="mgr-form" onSubmit={savePw} noValidate>
          <div className="admin-field"><label htmlFor="custNewPass">New password</label><PasswordInput id="custNewPass" autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setMsg(""); }} /></div>
          <p className="admin-form-msg" aria-live="polite">{msg}</p>
          <div className="mgr-modal-actions"><button className="admin-btn" type="button" onClick={() => setPwFor(null)}>Cancel</button><button className="admin-btn primary" type="submit" disabled={!pw}>Save password</button></div>
        </form>
      </Modal>
    </Panel>
  );
}

/* ───────────────────────── Login history ───────────────────────── */
export function HistoryPanel() {
  const history = useLoginHistory();
  const cls = { customer: "cust", owner: "owner", manager: "mgr" } as const;
  return (
    <Panel title="Login history" subtitle="All sign-in events for customers, managers, and admin activities. The table shows the latest 200; the download has everything." action={<a className="admin-btn" href="/api/admin/history?format=csv" download>Download CSV</a>}>
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

/* ───────────────────────── Sales (inside the Discounts tab) ───────────────────────── */
/**
 * Price cuts on one product, a scent family or a whole product type. The server applies them to shop prices,
 * so the shop, bag, checkout and orders all agree; customers see the regular price crossed out.
 */
export function SalesPanel() {
  const sales = useSales();
  const { products, oils, gifts } = useCatalog();
  const families = useAdminCategories().map((c) => c.name);
  const { showToast } = useUI();
  const [form, setForm] = useState({ target: "type:perfume", type: "percent" as "percent" | "flat", value: "", ends: "" });
  const [msg, setMsg] = useState("");

  const groups: [string, [string, string][]][] = [
    ["Whole range", [["type:perfume", "All perfume decants"], ["type:oil", "All perfume oils"], ["type:gift", "All gift sets"]]],
    ["Scent family", families.map((f) => [`family:${f.toLowerCase()}`, `${f} perfumes`])],
    ["One perfume", products.map((p) => [`product:${p.id}`, p.name])],
    ["One oil", oils.map((o) => [`product:${o.id}`, o.name])],
    ["One gift set", gifts.map((g) => [`product:${g.id}`, g.name])],
  ];
  const labelOf = (t: string) => groups.flatMap(([, o]) => o).find(([v]) => v === t)?.[1] ?? (t.startsWith("family:") ? `${t.slice(7)} perfumes` : "Item no longer in the shop");

  const add = async () => {
    const value = Number(form.value);
    if (!(value > 0)) { setMsg("Enter how much to take off."); return; }
    const res = await adminApi.addSale({ target: form.target, type: form.type, value, endsAt: form.ends ? new Date(`${form.ends}T23:59:59`).toISOString() : null });
    if (!res.ok) { setMsg(res.error ?? "Could not save."); return; }
    setMsg(""); setForm({ ...form, value: "", ends: "" });
    showToast(`Sale added: ${labelOf(form.target)}, ${form.type === "percent" ? `${value}%` : money(value)} off.`);
  };

  return (
    <Panel title="Sales" subtitle="Take money off one product, a scent family or a whole range. Customers see the old price crossed out. If several sales match, the customer gets the biggest one; discount codes then apply on top.">
      <div className="coupon-add-row">
        <div className="admin-field"><label htmlFor="saleTarget">Applies to</label>
          <select id="saleTarget" style={inputStyle} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            {groups.filter(([, o]) => o.length).map(([g, o]) => <optgroup key={g} label={g}>{o.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>)}
          </select>
        </div>
        <div className="admin-field"><label htmlFor="saleType">Type</label>
          <select id="saleType" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}>
            <option value="percent">Percent off (%)</option><option value="flat">Taka off each (৳)</option>
          </select>
        </div>
        <div className="admin-field"><label htmlFor="saleValue">Amount</label><input id="saleValue" type="number" min={1} max={form.type === "percent" ? 90 : undefined} placeholder={form.type === "percent" ? "e.g. 15" : "e.g. 100"} style={inputStyle} value={form.value} onChange={(e) => { setForm({ ...form, value: e.target.value }); setMsg(""); }} /></div>
        <div className="admin-field"><label htmlFor="saleEnds">Ends <small style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</small></label><input id="saleEnds" type="date" style={inputStyle} value={form.ends} onChange={(e) => setForm({ ...form, ends: e.target.value })} /></div>
        <button className="admin-btn primary" type="button" style={{ height: 42 }} onClick={add}>Add sale</button>
      </div>
      <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".8rem" }}>{msg}</p>
      <table className="admin-table">
        <thead><tr><th>Applies to</th><th>Discount</th><th>Ends</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {!sales.length && emptyRow(5, "No sales yet.")}
          {sales.map((s) => {
            const ended = !!s.endsAt && new Date(s.endsAt) < new Date();
            return (
              <tr key={s.id}>
                <td><strong style={{ fontSize: ".9rem" }}>{labelOf(s.target)}</strong></td>
                <td className="is-deal" style={{ fontWeight: 700 }}>{s.type === "percent" ? `${s.value}% off` : `${money(s.value)} off`}</td>
                <td>{s.endsAt ? formatDate(s.endsAt) : "No end date"}</td>
                <td><span className={`pill ${s.active && !ended ? "live" : "off"}`}>{!s.active ? "Off" : ended ? "Ended" : "On"}</span></td>
                <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                  <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => void adminApi.setSaleActive(s.id, !s.active)}>{s.active ? "Turn off" : "Turn on"}</button>
                  <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => { if (window.confirm(`Delete the sale on ${labelOf(s.target)}?`)) void adminApi.removeSale(s.id); }}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────────────────────── Coupons ───────────────────────── */
export function CouponsPanel() {
  const coupons = useCoupons();
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: "", expires: "", maxUses: "", once: "yes" });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const add = async () => {
    const res = await adminApi.addCoupon({
      code: form.code, type: form.type, value: Number(form.value),
      // A date means "valid through that day" (shop's local time).
      expiresAt: form.expires ? new Date(`${form.expires}T23:59:59`).toISOString() : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      oncePerCustomer: form.once === "yes",
    });
    if (!res.ok) { setMsg({ text: res.error ?? "", ok: false }); return; }
    setForm({ ...form, code: "", value: "", expires: "", maxUses: "", once: "yes" });
    setMsg({ text: "Code added.", ok: true });
  };

  return (
    <Panel title="Discount codes" subtitle="Codes customers apply at checkout. “Once per customer” works for guests too (one use per phone number, and per account when signed in). “Signed-in customers, every time” can be reused without limit, but guests are asked to sign in first. Max uses counts every use of the code.">
      <div className="coupon-add-row">
        <div className="admin-field"><label htmlFor="newCouponCode">Code</label><input id="newCouponCode" type="text" placeholder="e.g. SAVE15" maxLength={20} style={inputStyle} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
        <div className="admin-field"><label htmlFor="newCouponType">Type</label>
          <select id="newCouponType" style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "flat" })}>
            <option value="percent">Percent off (%)</option><option value="flat">Flat off (৳)</option>
          </select>
        </div>
        <div className="admin-field"><label htmlFor="newCouponValue">Value</label><input id="newCouponValue" type="number" min={1} placeholder="e.g. 10" style={inputStyle} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
        <div className="admin-field"><label htmlFor="newCouponExpires">Valid until <small style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</small></label><input id="newCouponExpires" type="date" style={inputStyle} value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></div>
        <div className="admin-field"><label htmlFor="newCouponMax">Max uses <small style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</small></label><input id="newCouponMax" type="number" min={1} placeholder="Unlimited" style={inputStyle} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
        <div className="admin-field"><label htmlFor="newCouponOnce">Who can use it</label>
          <select id="newCouponOnce" style={inputStyle} value={form.once} onChange={(e) => setForm({ ...form, once: e.target.value })}>
            <option value="yes">Once per customer</option><option value="no">Signed-in, every time</option>
          </select>
        </div>
        <button className="admin-btn primary" type="button" style={{ height: 42 }} onClick={add}>Add code</button>
      </div>
      <p className="admin-form-msg" aria-live="polite" style={{ marginBottom: ".8rem", color: msg?.ok ? "#446046" : "#a84d58" }}>{msg?.text}</p>
      <table className="admin-table">
        <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Valid until</th><th>Who can use it</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.code}>
              <td><span className="coupon-tag">{c.code}</span></td>
              <td>{c.type === "percent" ? "Percent" : "Flat"}</td>
              <td>{c.type === "percent" ? `${c.value}%` : `৳${c.value}`}</td>
              <td>{c.uses ?? 0}{c.maxUses ? ` of ${c.maxUses}` : ""}</td>
              <td>{c.expiresAt ? formatDate(c.expiresAt) : "No end date"}</td>
              <td><select aria-label={`Who can use ${c.code}`} style={{ ...inputStyle, minHeight: 34, padding: ".3rem .5rem", fontSize: ".78rem" }} value={c.oncePerCustomer === false ? "no" : "yes"} onChange={(e) => void adminApi.setCouponOnce(c.code, e.target.value === "yes")}>
                <option value="yes">Once per customer</option><option value="no">Signed-in, every time</option>
              </select></td>
              <td>{(() => {
                const expired = !!c.expiresAt && new Date(c.expiresAt) < new Date();
                const usedUp = !!c.maxUses && (c.uses ?? 0) >= c.maxUses;
                return <span className={`pill ${c.active && !expired && !usedUp ? "live" : "off"}`}>{!c.active ? "Off" : expired ? "Expired" : usedUp ? "Used up" : "Active"}</span>;
              })()}</td>
              <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                <button className="admin-btn" style={{ fontSize: ".75rem", color: "var(--rose-deep)" }} type="button" onClick={() => void adminApi.toggleCoupon(c.code, !c.active)}>{c.active ? "Deactivate" : "Activate"}</button>
                <button className="admin-btn danger" style={{ fontSize: ".75rem" }} type="button" onClick={() => { if (window.confirm(`Delete the code ${c.code}?`)) void adminApi.removeCoupon(c.code); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────────────────────── Managers ───────────────────────── */
const NO_PERMS: ManagerPermissions = { orders: false, inventory: false, products: false, customers: false, history: false, coupons: false, content: false, reviews: false };
const DEFAULT_PERMS: ManagerPermissions = { orders: true, inventory: true, products: false, customers: false, history: false, coupons: true, content: false, reviews: false };

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
          <thead><tr><th>Name</th><th>Username</th><th>Orders</th><th>Inventory</th><th>Prices</th><th>Customers</th><th>History</th><th>Coupons</th><th>Notice &amp; categories</th><th>Reviews</th><th>Actions</th></tr></thead>
          <tbody>
            {!managers.length && emptyRow(11, "No manager accounts yet. Add one to get started.")}
            {managers.map((m) => (
              <tr key={m.id}>
                <td><strong style={{ fontSize: ".88rem" }}>{m.name}</strong></td>
                <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{m.username}</td>
                <td>{tick(m.permissions.orders)}</td><td>{tick(m.permissions.inventory)}</td><td>{tick(m.permissions.products)}</td><td>{tick(m.permissions.customers)}</td>
                <td>{tick(m.permissions.history)}</td><td>{tick(m.permissions.coupons)}</td><td>{tick(m.permissions.content)}</td><td>{tick(m.permissions.reviews)}</td>
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
          <div className="admin-field"><label htmlFor="mgrPass">{isEdit ? "New password (leave blank to keep current)" : "Password"}</label><PasswordInput id="mgrPass" autoComplete="new-password" placeholder="Set a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
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

/* ───────────────────────── Sizes on sale (inside the Inventory tab) ───────────────────────── */
type Draft = Record<string, string>;
const draftOf = (vols: number[], values: Record<number, number | undefined>): Draft =>
  Object.fromEntries(vols.map((v) => [v, values[v] === undefined ? "" : String(values[v])]));
const sameDraft = (keys: (number | string)[], a: Draft, b: Draft) => keys.every((k) => (a[k] ?? "") === (b[k] ?? ""));
const num = (s: string | undefined) => (s === undefined || s.trim() === "" ? NaN : Number(s));
const numInput = { ...inputStyle, width: 88, minHeight: 38, padding: ".45rem .55rem", textAlign: "right" as const };

/**
 * Admin control of the volume sections customers can choose (add / delete), the spray count of each,
 * every perfume's price per volume (blank = not offered), and oil / gift-set prices.
 * Changes apply immediately to the storefront, product pop-up, filters, search, cart and checkout.
 */
export function SizesPanel() {
  const overrides = useCatalogOverrides();
  const perfumes = perfumesOf(overrides);
  const { showToast } = useUI();
  const volumes = activeVolumes(overrides);
  const sprays = effectiveSprays(overrides);
  const volKey = volumes.join(",");

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
  const previewBase = perfumes.find((p) => p.id === previewId) ?? perfumes[0] ?? PRODUCTS[0];
  const previewProduct = applyToProduct(previewBase, sectionView);


  const pricesAt = (v: number) => perfumes.map((p) => applyToProduct(p, sectionView).prices[v]).filter((x): x is number => x !== undefined);
  const pricedCount = (v: number) => pricesAt(v).length;
  const priceSummary = (v: number) => {
    const ps = pricesAt(v);
    if (!ps.length) return "Not priced yet";
    const lo = Math.min(...ps), hi = Math.max(...ps);
    return lo === hi ? money(lo) : `${money(lo)} – ${money(hi)}`;
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

  return (
    <>
      <Panel
        title="Sizes on sale"
        subtitle="Each size customers can choose: its volume and spray count. Delete a size to stop selling it; add one to start selling a new size. Each perfume's own prices are set with Edit in the table above."
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".6rem", marginBottom: ".4rem" }}>
          <label htmlFor="previewAs" style={{ fontSize: ".82rem", fontWeight: 700 }}>Customer view shown for</label>
          <select id="previewAs" style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".35rem .6rem" }} value={previewId} onChange={(e) => setPreviewId(Number(e.target.value))}>
            {perfumes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <small style={{ color: "var(--muted)" }}>Prices can differ per perfume — pick one to see exactly what its customers see.</small>
        </div>
        <table className="admin-table admin-table--wide">
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
                      : <span className={`pill ${n ? "live" : "off"}`}>{n} of {perfumes.length} perfumes</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: ".4rem" }}>
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
          <small style={{ color: "var(--muted)" }}>The new section goes on sale for every perfume at this price. To charge a different price for one perfume, open it with Edit in the Inventory table.</small>
        </form>
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
