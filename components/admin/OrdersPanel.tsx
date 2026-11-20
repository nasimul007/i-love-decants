"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/useServices";
import { adminApi } from "@/lib/api/admin";
import { formatDateTime, money } from "@/lib/format";
import type { Order } from "@/types";
import { Modal, Panel, emptyRow, inputStyle } from "./shared";

const STATUSES: Order["status"][] = ["received", "confirmed", "shipped", "delivered", "cancelled"];
const label = { color: "var(--muted)", fontSize: ".74rem", textTransform: "uppercase" as const, letterSpacing: ".06em" };

/** Everything about one order: customer, delivery, payment, every line, and the full price breakdown. */
export function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return <Modal open={false} onClose={onClose} title="" subtitle="">{null}</Modal>;
  const o = order;
  const delivery = o.delivery.charge;
  const rows: [string, string][] = [
    ["Subtotal", money(o.subtotal)],
    ...(o.bulkDiscount ? [["Large-order discount", `−${money(o.bulkDiscount)}`] as [string, string]] : []),
    ...(o.discount ? [[`Discount code${o.couponCode ? ` (${o.couponCode})` : ""}`, `−${money(o.discount)}`] as [string, string]] : []),
    ["Delivery", money(delivery)],
  ];
  return (
    <Modal open onClose={onClose} title={`Order ${o.id}`} subtitle={`Placed ${formatDateTime(o.placedAt)}`}>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <span style={label}>Status</span>
          <select aria-label={`Status of ${o.id}`} value={o.status} onChange={(e) => void adminApi.setOrderStatus(o.id, e.target.value as Order["status"])}
            style={{ ...inputStyle, width: "auto", minHeight: 36, padding: ".3rem .6rem", textTransform: "capitalize" }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <section>
          <div style={label}>Customer</div>
          <strong>{o.customer.name || "—"}</strong>
          <div style={{ fontSize: ".88rem" }}>{o.customer.phone || "—"}{o.customer.email ? ` · ${o.customer.email}` : " · guest checkout"}</div>
        </section>

        <section>
          <div style={label}>Delivery</div>
          <div style={{ fontSize: ".9rem" }}>{o.delivery.address || "—"}</div>
          <div style={{ fontSize: ".88rem", color: "var(--muted)" }}>{o.delivery.city || "—"} · charge {money(delivery)}</div>
          {o.delivery.notes && <div style={{ fontSize: ".86rem", marginTop: ".25rem" }}><b>Note:</b> {o.delivery.notes}</div>}
        </section>

        <section>
          <div style={label}>Payment</div>
          <div style={{ fontSize: ".9rem" }}>{o.transaction.type}{o.transaction.provider ? ` · ${o.transaction.provider}` : ""}</div>
          {o.transaction.method !== "cod" && (
            <div style={{ fontSize: ".86rem", color: "var(--muted)" }}>Account {o.transaction.payerAccount || "—"} · Ref {o.transaction.reference || "—"}</div>
          )}
        </section>

        <section>
          <div style={label}>Items ({o.items.reduce((n, i) => n + i.qty, 0)})</div>
          <table className="admin-table" style={{ minWidth: 0 }}>
            <thead><tr><th>Item</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Price</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {o.items.map((i) => (
                <tr key={i.key}>
                  <td><strong style={{ fontSize: ".88rem" }}>{i.name}</strong><small style={{ display: "block", color: "var(--muted)" }}>{i.detail}</small></td>
                  <td style={{ textAlign: "right" }}>{i.qty}</td>
                  <td style={{ textAlign: "right" }}>{money(i.price)}</td>
                  <td style={{ textAlign: "right" }}>{money(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ borderTop: "1px solid var(--line)", paddingTop: ".7rem" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", padding: ".15rem 0" }}><span>{k}</span><span>{v}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", paddingTop: ".35rem" }}>
            <span>Grand total</span><span style={{ color: "var(--rose-deep)" }}>{money(o.grandTotal)}</span>
          </div>
        </section>
      </div>
      <div className="mgr-modal-actions" style={{ marginTop: "1rem" }}>
        <button className="admin-btn primary" type="button" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

/** All orders, newest first, with a status filter, paging and a details view. */
export function OrdersPanel() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { orders, pages, total, loaded } = useOrders(page, 15, status || undefined);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = orders.find((o) => o.id === viewingId) ?? null; // stays in step when the status changes

  return (
    <>
      <Panel
        title="Orders"
        subtitle={`${total} order${total === 1 ? "" : "s"}${status ? ` · ${status}` : ""}. Open an order to see the full details.`}
        action={
          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{ ...inputStyle, width: "auto", minHeight: 38, textTransform: "capitalize" }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      >
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>City</th><th>Items</th><th style={{ textAlign: "right" }}>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {!orders.length && emptyRow(7, loaded ? "No orders found." : "Loading…")}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong><small style={{ display: "block", color: "var(--muted)" }}>{formatDateTime(o.placedAt)}</small></td>
                <td>{o.customer.name || "—"}<small style={{ display: "block", color: "var(--muted)" }}>{o.customer.phone}</small></td>
                <td>{o.delivery.city || "—"}</td>
                <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "var(--rose-deep)" }}>{money(o.grandTotal)}</td>
                <td><span className="pill live" style={{ textTransform: "capitalize" }}>{o.status}</span></td>
                <td><button className="admin-btn primary" style={{ fontSize: ".75rem" }} type="button" onClick={() => setViewingId(o.id)}>View details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".8rem", marginTop: "1rem" }}>
            <button className="admin-btn" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
            <span style={{ fontSize: ".84rem", color: "var(--muted)" }}>Page {page} of {pages}</span>
            <button className="admin-btn" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}
      </Panel>
      <OrderDetailModal order={viewing} onClose={() => setViewingId(null)} />
    </>
  );
}
