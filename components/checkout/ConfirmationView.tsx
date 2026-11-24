"use client";

import Link from "next/link";
import { useCurrentCustomer, useLastOrder } from "@/hooks/useServices";
import { money } from "@/lib/format";

export function ConfirmationView() {
  const order = useLastOrder();
  const customer = useCurrentCustomer();
  const cod = order?.transaction.method === "cod";
  const grand = order?.grandTotal ?? 0;
  const location = order ? [order.delivery.address, order.delivery.city].filter(Boolean).join(", ") || "Address pending" : "";
  const type = order?.transaction.type || "Payment route";
  const provider = order?.transaction.provider || "Provider to be confirmed";

  return (
    <div className="container confirmation-layout">
      <article className="confirmation-page-card">
        <span className="confirmation-check" aria-hidden="true">✓</span>
        <span className="eyebrow">Order request received</span>
        <h2>Your order is ready for verification.</h2>
        <p>Order reference <strong>{order?.id ?? "—"}</strong> · Total <strong>{money(grand)}</strong></p>
        <p className="confirmation-payment">
          {!order
            ? "Complete checkout to see your delivery and payment preview."
            : cod
              ? `Cash on Delivery is selected for ${money(grand)}. Please keep the amount ready when your order arrives.`
              : `${type} via ${provider} is selected for ${money(grand)}. We will verify the transaction details before confirming delivery.`}
        </p>
        {order && (
          <div className="confirmation-details">
            <article className="confirmation-detail"><span>Delivery to</span><strong>{order.customer.name || "—"}</strong><small>{location}</small></article>
            <article className="confirmation-detail"><span>Delivery charge</span><strong>{money(order.delivery.charge)}</strong><small>{order.delivery.city || "Selected delivery zone"}</small></article>
            <article className="confirmation-detail"><span>Payment route</span><strong>{type}</strong><small>{provider}</small></article>
            <article className="confirmation-detail">
              <span>{cod ? "Payment timing" : "Transaction reference"}</span>
              <strong>{cod ? "No advance transaction required" : order.transaction.reference || "Reference pending"}</strong>
              <small>{cod ? "Pay the rider when your order arrives." : "We will check this before dispatch."}</small>
            </article>
          </div>
        )}
        <p className="confirmation-contact">We will reach you on <strong>{order?.customer.phone ?? "your phone number"}</strong> to confirm delivery.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          {customer && order && <Link className="btn btn-primary" href={`/account#order-${order.id}`}>Track this order</Link>}
          <Link className={`btn ${customer && order ? "btn-secondary" : "btn-primary"}`} href="/">Return to shop</Link>
          <Link className="btn btn-secondary" href="/products">Continue browsing</Link>
        </div>
      </article>

      <aside className="confirmation-summary-card">
        <span className="eyebrow">Order overview</span>
        <h2>Your selected items</h2>
        <div className="confirmation-items">
          {order?.items.length ? order.items.map((i) => (
            <article className="confirmation-item" key={i.key}>
              <div><strong>{i.name}</strong><small>{i.detail} · Qty {i.qty}</small></div>
              <span>{money(i.price * i.qty)}</span>
            </article>
          )) : <p className="cart-note">Your completed order will appear here.</p>}
        </div>
        <div className="summary-row"><span>Subtotal</span><strong>{money(order?.subtotal ?? 0)}</strong></div>
        {!!order?.bulkDiscount && <div className="summary-row is-deal"><span>Large-order discount</span><strong>−{money(order.bulkDiscount)}</strong></div>}
        {!!order?.discount && <div className="summary-row is-deal"><span>Discount code{order.couponCode ? ` (${order.couponCode})` : ""}</span><strong>−{money(order.discount)}</strong></div>}
        <div className="summary-row"><span>Delivery</span><strong>{money(order?.delivery.charge ?? 0)}</strong></div>
        <div className="summary-row summary-total"><span>Grand total</span><strong>{money(grand)}</strong></div>
      </aside>
    </div>
  );
}
