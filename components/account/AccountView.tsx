"use client";

import { toLocalPhone } from "@/lib/validators";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useUI } from "@/components/providers/UIProvider";
import { useCurrentCustomer, useMyOrders } from "@/hooks/useServices";
import { useApi } from "@/lib/api/client";
import { ME, customerApi } from "@/lib/api/customer";
import { formatDate, formatDateTime, initials, money } from "@/lib/format";
import type { Order } from "@/types";
import { CitySelect } from "@/components/checkout/CitySelect";
import { BD_CITIES } from "@/lib/data/cities";
import { usePrefs, useT } from "@/components/providers/PrefsProvider";
import { dateLocale } from "@/lib/i18n";

type Tab = "orders" | "profile";

const STEPS: { id: Order["status"]; label: string; hint: string }[] = [
  { id: "received", label: "Received", hint: "We have your order." },
  { id: "confirmed", label: "Confirmed", hint: "Verified and being prepared." },
  { id: "shipped", label: "Shipped", hint: "On its way to you." },
  { id: "delivered", label: "Delivered", hint: "Enjoy your fragrance." },
];

function Tracker({ status }: { status: Order["status"] }) {
  const t = useT();
  if (status === "cancelled") return <p className="acct-cancelled">{t("This order was cancelled.")}</p>;
  const at = STEPS.findIndex((s) => s.id === status);
  return (
    <ol className="acct-track" aria-label={t("Order status: {s}", { s: t(status) })}>
      {STEPS.map((s, i) => (
        <li key={s.id} className={i < at ? "is-done" : i === at ? "is-current" : ""} aria-current={i === at ? "step" : undefined}>
          <span className="acct-track-dot" aria-hidden="true">{i <= at ? "✓" : ""}</span>
          <strong>{t(s.label)}</strong>
          <small>{i === at ? t(s.hint) : ""}</small>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const qty = order.items.reduce((n, i) => n + i.qty, 0);
  const { t, lang } = usePrefs();
  return (
    <article className={`acct-order${open ? " is-open" : ""}`} id={`order-${order.id}`}>
      <button type="button" className="acct-order-head" aria-expanded={open} onClick={onToggle}>
        <span>
          <strong>{order.id}</strong>
          <small>{formatDateTime(order.placedAt, dateLocale(lang))} · {t(qty === 1 ? "{n} item" : "{n} items", { n: qty })}</small>
        </span>
        <span className="acct-order-right">
          <span className={`acct-status s-${order.status}`}>{t(order.status)}</span>
          <b>{money(order.grandTotal)}</b>
          <span aria-hidden="true" className="acct-chev">▾</span>
        </span>
      </button>
      {open && (
        <div className="acct-order-body">
          <Tracker status={order.status} />
          <div className="acct-cols">
            <div>
              <h4>{t("Items")}</h4>
              <ul className="acct-items">
                {order.items.map((i) => (
                  <li key={i.key}>
                    <span>{i.name}<small>{i.detail.split(" · ").map((d) => t(d).replace("Full bottle", t("Full bottle"))).join(" · ")}</small></span>
                    <span>{i.qty} × {money(i.price)}</span>
                  </li>
                ))}
              </ul>
              <dl className="acct-sum">
                <div><dt>{t("Subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
                {!!order.bulkDiscount && <div className="is-deal"><dt>{t("Large-order discount")}</dt><dd>−{money(order.bulkDiscount)}</dd></div>}
                {order.discount > 0 && <div className="is-deal"><dt>{t("Discount code")}{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{money(order.discount)}</dd></div>}
                <div><dt>{t("Delivery")}</dt><dd>{money(order.delivery.charge)}</dd></div>
                <div className="total"><dt>{t("Total")}</dt><dd>{money(order.grandTotal)}</dd></div>
              </dl>
            </div>
            <div>
              <h4>{t("Delivery")}</h4>
              <p>{order.customer.name}<br />{order.customer.phone}<br />{[order.delivery.address, order.delivery.city].filter(Boolean).join(", ")}</p>
              {order.delivery.notes && <p className="acct-note">{t("Note:")} {order.delivery.notes}</p>}
              <h4>{t("Payment")}</h4>
              <p>{order.transaction.method === "cod" ? t("Cash on delivery: pay the rider when it arrives.") : `${t(order.transaction.type)} · ${order.transaction.provider}`}</p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function AccountView() {
  const { openAuth, showToast } = useUI();
  const { t, lang } = usePrefs();
  const loaded = useApi(ME).loaded;
  const customer = useCurrentCustomer();
  const orders = useMyOrders(!!customer);
  const [tab, setTab] = useState<Tab>("orders");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) setForm({ name: customer.name, phone: customer.phone, address: customer.address, city: customer.city ?? "" });
  }, [customer]);

  // Deep link: /account#order-ILD-1234 opens that order.
  useEffect(() => {
    const id = window.location.hash.replace(/^#order-/, "");
    if (id && orders.some((o) => o.id === id)) { setTab("orders"); setOpenId(id); }
  }, [orders]);

  if (!loaded) return <div className="container"><p className="acct-empty">{t("Loading your account…")}</p></div>;

  if (!customer) {
    return (
      <div className="container">
        <div className="acct-card acct-gate">
          <h2>{t("Sign in to see your orders")}</h2>
          <p>{t("Create an account or sign in to track orders and save your delivery details.")}</p>
          <div className="acct-actions">
            <button className="profile-save-btn" type="button" onClick={() => openAuth("login")}>{t("Sign in")}</button>
            <button className="acct-ghost" type="button" onClick={() => openAuth("register")}>{t("Create account")}</button>
          </div>
        </div>
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((n, o) => n + o.grandTotal, 0);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await customerApi.updateProfile(form);
    setSaving(false);
    if (!res.ok) { setError(t(res.error ?? "")); return; }
    setError("");
    showToast(t("Profile updated."));
  };

  const signOut = async () => { await customerApi.logout(); showToast(t("Signed out.")); };

  return (
    <div className="container acct">
      <div className="acct-top">
        <span className="acct-avatar" aria-hidden="true">{initials(customer.name)}</span>
        <div>
          <h2>{customer.name}</h2>
          <small>{customer.email} · {t("Member since {date}", { date: formatDate(customer.joinedAt, dateLocale(lang)) })}</small>
        </div>
        <button className="profile-logout acct-signout" type="button" onClick={signOut}>{t("Sign out")}</button>
      </div>

      <div className="acct-stats">
        <div><b>{orders.length}</b><span>{t("Orders")}</span></div>
        <div><b>{active}</b><span>{t("In progress")}</span></div>
        <div><b>{money(spent)}</b><span>{t("Total spent")}</span></div>
      </div>

      <div className="acct-tabs" role="tablist">
        {(["orders", "profile"] as Tab[]).map((x) => (
          <button key={x} type="button" role="tab" aria-selected={tab === x} className={tab === x ? "is-active" : ""} onClick={() => setTab(x)}>
            {x === "orders" ? t("My orders") : t("Profile")}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        orders.length ? (
          <div className="acct-orders">
            {orders.map((o) => <OrderCard key={o.id} order={o} open={openId === o.id} onToggle={() => setOpenId(openId === o.id ? null : o.id)} />)}
          </div>
        ) : (
          <div className="acct-card acct-gate">
            <h2>{t("No orders yet")}</h2>
            <p>{t("When you place an order it will appear here with live status.")}</p>
            <Link className="profile-save-btn acct-link" href="/products">{t("Browse perfumes")}</Link>
          </div>
        )
      ) : (
        <form className="acct-card acct-form" onSubmit={save}>
          <h3>{t("Personal details")}</h3>
          <div className="profile-field"><label htmlFor="acct-email">{t("Email")}</label><input id="acct-email" type="email" value={customer.email} disabled /></div>
          <div className="profile-field"><label htmlFor="acct-name">{t("Full name")}</label><input id="acct-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="profile-field"><label htmlFor="acct-phone">{t("Phone")}</label><input id="acct-phone" type="tel" inputMode="numeric" maxLength={11} pattern="01[0-9]{9}" autoComplete="tel" value={form.phone} placeholder="01XXXXXXXXX" onChange={(e) => setForm({ ...form, phone: toLocalPhone(e.target.value) })} /></div>
          <div className="profile-field"><label htmlFor="acct-addr">{t("Delivery address")}</label><textarea id="acct-addr" value={form.address} placeholder={t("House, road, area, landmark…")} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="profile-field"><label htmlFor="acct-city">{t("City")}</label><CitySelect id="acct-city" value={form.city} options={BD_CITIES} onChange={(city) => setForm({ ...form, city })} /></div>
          {error && <p className="auth-msg">{error}</p>}
          <button className="profile-save-btn" type="submit" disabled={saving}>{saving ? t("Saving…") : t("Save changes")}</button>
        </form>
      )}
    </div>
  );
}
