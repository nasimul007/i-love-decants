"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { CheckoutProgress } from "./CheckoutProgress";
import Link from "next/link";
import { useCurrentCustomer, useLastOrder } from "@/hooks/useServices";
import { money } from "@/lib/format";

export function ConfirmationView() {
  const order = useLastOrder();
  const customer = useCurrentCustomer();
  const t = useT();
  const cod = order?.transaction.method === "cod";
  const grand = order?.grandTotal ?? 0;
  const location = order ? [order.delivery.address, order.delivery.city].filter(Boolean).join(", ") || t("Address pending") : "";
  const type = t(order?.transaction.type || "Payment route");
  const provider = t(order?.transaction.provider || "Provider to be confirmed");

  return (
    <>
    {order && <div className="container"><CheckoutProgress done /></div>}
    <div className="container confirmation-layout">
      <article className="confirmation-page-card">
        <span className="confirmation-check" aria-hidden="true">✓</span>
        <span className="eyebrow">{t("Order request received")}</span>
        <h2>{t("Your order is ready for verification.")}</h2>
        <p>{t("Order reference")} <strong>{order?.id ?? "—"}</strong> · {t("Total")} <strong>{money(grand)}</strong></p>
        <p className="confirmation-payment">
          {!order
            ? t("Complete checkout to see your delivery and payment preview.")
            : cod
              ? t("Cash on Delivery is selected for {amount}. Please keep the amount ready when your order arrives.", { amount: money(grand) })
              : t("{type} via {provider} is selected for {amount}. We will verify the transaction details before confirming delivery.", { type, provider, amount: money(grand) })}
        </p>
        {order && (
          <div className="confirmation-details">
            <article className="confirmation-detail"><span>{t("Delivery to")}</span><strong>{order.customer.name || "—"}</strong><small>{location}</small></article>
            <article className="confirmation-detail"><span>{t("Delivery charge")}</span><strong>{money(order.delivery.charge)}</strong><small>{order.delivery.city || t("Selected delivery zone")}</small></article>
            <article className="confirmation-detail"><span>{t("Payment route")}</span><strong>{type}</strong><small>{provider}</small></article>
            <article className="confirmation-detail">
              <span>{cod ? t("Payment timing") : t("Transaction reference")}</span>
              <strong>{cod ? t("No advance transaction required") : order.transaction.reference || t("Reference pending")}</strong>
              <small>{cod ? t("Pay the rider when your order arrives.") : t("We will check this before dispatch.")}</small>
            </article>
          </div>
        )}
        <p className="confirmation-contact">{t("We will reach you on")} <strong>{order?.customer.phone ?? t("your phone number")}</strong> {t("to confirm delivery.")}</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          {customer && order && <Link className="btn btn-primary" href={`/account#order-${order.id}`}>{t("Track this order")}</Link>}
          <Link className={`btn ${customer && order ? "btn-secondary" : "btn-primary"}`} href="/">{t("Return to shop")}</Link>
          <Link className="btn btn-secondary" href="/products">{t("Continue browsing")}</Link>
        </div>
      </article>

      <aside className="confirmation-summary-card">
        <span className="eyebrow">{t("Order overview")}</span>
        <h2>{t("Your selected items")}</h2>
        <div className="confirmation-items">
          {order?.items.length ? order.items.map((i) => (
            <article className="confirmation-item" key={i.key}>
              <div><strong>{i.name}</strong><small>{i.detail.split(" · ").map((d) => t(d).replace("Full bottle", t("Full bottle"))).join(" · ")} · {t("Qty")} {i.qty}</small></div>
              <span>{money(i.price * i.qty)}</span>
            </article>
          )) : <p className="cart-note">{t("Your completed order will appear here.")}</p>}
        </div>
        <div className="summary-row"><span>{t("Subtotal")}</span><strong>{money(order?.subtotal ?? 0)}</strong></div>
        {!!order?.bulkDiscount && <div className="summary-row is-deal"><span>{t("Large-order discount")}</span><strong>−{money(order.bulkDiscount)}</strong></div>}
        {!!order?.discount && <div className="summary-row is-deal"><span>{t("Discount code")}{order.couponCode ? ` (${order.couponCode})` : ""}</span><strong>−{money(order.discount)}</strong></div>}
        <div className="summary-row"><span>{t("Delivery")}</span><strong>{money(order?.delivery.charge ?? 0)}</strong></div>
        <div className="summary-row summary-total"><span>{t("Grand total")}</span><strong>{money(grand)}</strong></div>
      </aside>
    </div>
    </>
  );
}
