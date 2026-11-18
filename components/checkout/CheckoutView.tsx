"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useCart, useCoupons, useCurrentCustomer } from "@/hooks/useServices";
import { couponService } from "@/lib/services/coupons";
import { orderService, PAYMENT_ROUTES } from "@/lib/services/orders";
import { DELIVERY_ZONES } from "@/lib/config";
import { isBdPhone } from "@/lib/validators";
import { money } from "@/lib/format";
import type { Coupon, PaymentMethod } from "@/types";

type Field = "fullName" | "phone" | "address" | "city" | "provider" | "payerAccount" | "reference";

export function CheckoutView() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const customer = useCurrentCustomer();
  const coupons = useCoupons();

  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", notes: "", reference: "", payerAccount: "" });
  const [zone, setZone] = useState<number>(DELIVERY_ZONES[0].value);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [provider, setProvider] = useState(PAYMENT_ROUTES.bank.providers[0]);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const route = PAYMENT_ROUTES[method];

  // Prefill from the signed-in customer's profile (never overwrite what was typed).
  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || customer.name,
      phone: f.phone || customer.phone,
      address: f.address || customer.address,
    }));
  }, [customer]);

  // Keep provider valid when the payment type changes.
  useEffect(() => {
    if (!route.offline && !route.providers.includes(provider)) setProvider(route.providers[0]);
  }, [route, provider]);

  // If the applied coupon is deactivated/removed by an admin meanwhile, drop it.
  useEffect(() => {
    if (coupon && !couponService.find(coupon.code, coupons)) { setCoupon(null); setCouponMsg(null); }
  }, [coupons, coupon]);

  const discount = couponService.discount(coupon, subtotal);
  const grandTotal = Math.max(0, subtotal - discount) + (items.length ? zone : 0);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponMsg({ text: "Please enter a discount code.", ok: false }); return; }
    const found = couponService.find(code, couponService.list());
    if (!found) {
      setCoupon(null);
      setCouponMsg({ text: "Code not recognised. Check the spelling and try again.", ok: false });
      return;
    }
    setCoupon(found);
    const label = found.type === "percent" ? `${found.value}% off` : `৳${found.value} off`;
    setCouponMsg({ text: `✓ ${code} applied — ${label} (−${money(couponService.discount(found, subtotal))})`, ok: true });
  };

  const paymentLabel = useMemo(
    () => (route.offline ? `${route.label} · Pay on arrival` : `${route.label} · ${provider}`),
    [route, provider],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    const next: Partial<Record<Field, string>> = {};
    const required = "Please fill in this field.";
    if (!form.fullName.trim()) next.fullName = required;
    if (!form.phone.trim()) next.phone = required;
    else if (!isBdPhone(form.phone)) next.phone = "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
    if (!form.address.trim()) next.address = required;
    if (!form.city.trim()) next.city = required;
    if (!route.offline) {
      if (!provider) next.provider = required;
      if (!form.payerAccount.trim()) next.payerAccount = required;
      if (!form.reference.trim()) next.reference = required;
    }
    setErrors(next);
    if (Object.keys(next).length) { setFormError("Please complete the highlighted fields before confirming."); return; }
    setFormError("");

    setSubmitted(true);
    orderService.place({
      customer: { name: form.fullName.trim(), phone: form.phone.trim(), email: customer?.email },
      delivery: { address: form.address.trim(), city: form.city.trim(), notes: form.notes.trim(), charge: zone },
      transaction: {
        method, type: route.label,
        provider: route.offline ? "Pay on delivery" : provider,
        payerAccount: route.offline ? "" : form.payerAccount.trim(),
        reference: route.offline ? "Cash on Delivery" : form.reference.trim(),
      },
      items,
      subtotal,
      discount,
      couponCode: coupon?.code ?? null,
    });
    router.push("/order-confirmation");
  };

  const text = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });
  const err = (k: Field) => <span className="field-error">{errors[k]}</span>;

  if (!items.length && !submitted) {
    return (
      <div className="container checkout-layout">
        <div className="checkout-empty">
          <h2>Your bag is empty</h2>
          <p>Add a scent, a gift set, or a custom bottle before checking out.</p>
          <Link className="btn btn-primary" href="/products">Browse the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-layout">
      <form className="checkout-form-card" onSubmit={submit} noValidate>
        <div className="checkout-block">
          <span className="eyebrow">Step 1</span>
          <h2>Customer information</h2>
          <div className="form-grid">
            <div className="field"><label htmlFor="checkoutName">Full name</label><input id="checkoutName" type="text" placeholder="Your full name" {...text("fullName")} />{err("fullName")}</div>
            <div className="field"><label htmlFor="checkoutPhone">Phone number</label><input id="checkoutPhone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" {...text("phone")} />{err("phone")}</div>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 2</span>
          <h2>Delivery details</h2>
          <div className="form-grid">
            <div className="field full"><label htmlFor="checkoutAddress">Full delivery address</label><textarea id="checkoutAddress" placeholder="House, road, area, landmark…" {...text("address")} />{err("address")}</div>
            <div className="field"><label htmlFor="checkoutCity">City / Area</label><input id="checkoutCity" type="text" placeholder="e.g. Dhanmondi, Dhaka" {...text("city")} />{err("city")}</div>
            <div className="field">
              <label htmlFor="deliveryZone">Delivery charge</label>
              <select id="deliveryZone" value={zone} onChange={(e) => setZone(Number(e.target.value))}>
                {DELIVERY_ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
              </select>
            </div>
            <div className="field full"><label htmlFor="deliveryNote">Delivery notes <small>(optional)</small></label><textarea id="deliveryNote" placeholder="Preferred time, landmark, gift note, or anything helpful…" {...text("notes")} /></div>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 3</span>
          <h2>Choose your payment option</h2>
          <p className="wallet-hint">Cash on Delivery is selected by default. You can also choose a bank transfer or wallet payment if that suits you better.</p>
          <div className="payment-methods" role="radiogroup" aria-label="Choose a payment type">
            {([
              ["bank", "Bank transfer", "Choose Bank A, B, or C", "#b99750", ""],
              ["wallet", "Wallet payment", "Choose Wallet A, B, or C", "#a87987", ""],
              ["cod", "Cash on Delivery", "Pay in cash when your order arrives", "#8ca390", " payment-option--cash"],
            ] as const).map(([value, title, hint, tint, extra]) => (
              <label key={value} className={`payment-option${extra}`}>
                <input type="radio" name="paymentMethod" value={value} checked={method === value} onChange={() => { setMethod(value); setErrors({}); }} />
                <span className="payment-mark" style={{ ["--pay-tint" as string]: tint }} />
                <span className="payment-label"><strong>{title}</strong><small>{hint}</small></span>
              </label>
            ))}
          </div>
          <div className="wallet-fields" hidden={!!route.offline} aria-hidden={!!route.offline}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="transactionProvider">{route.providerLabel}</label>
                <select id="transactionProvider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  {route.providers.map((p) => <option key={p}>{p}</option>)}
                </select>
                {err("provider")}
              </div>
              <div className="field"><label htmlFor="payerAccount">{route.accountLabel}</label><input id="payerAccount" type="text" placeholder={route.accountPlaceholder || "Account or wallet number"} {...text("payerAccount")} />{err("payerAccount")}</div>
              <div className="field full"><label htmlFor="transactionId">Transaction reference</label><input id="transactionId" type="text" placeholder="Enter your bank or wallet transaction ID" {...text("reference")} />{err("reference")}</div>
            </div>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 4 (optional)</span>
          <h2>Discount code</h2>
          <div className="coupon-row">
            <div className="field">
              <label htmlFor="couponInput">Have a code?</label>
              <input
                id="couponInput" type="text" placeholder="e.g. WELCOME10" autoComplete="off" style={{ textTransform: "uppercase" }}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
              />
            </div>
            <button className="coupon-apply-btn" type="button" onClick={applyCoupon}>Apply</button>
          </div>
          <p className={`coupon-status${couponMsg ? (couponMsg.ok ? " ok" : " err") : ""}`}>{couponMsg?.text}</p>
        </div>

        <button className="btn btn-primary" type="submit">Confirm Order</button>
        <div className={`form-status${formError ? " is-visible" : ""}`} role="status">{formError}</div>
      </form>

      <aside className="order-summary-card">
        <span className="eyebrow">Order summary</span>
        <h2>Your bag</h2>
        <div className="checkout-items">
          {items.map((item) => (
            <article className="checkout-item" key={item.key}>
              <span className="checkout-item-swatch" style={{ ["--swatch" as string]: item.swatch || "#ead2d4" }} />
              <div><strong>{item.name}</strong><small>{item.detail} · Qty {item.qty}</small></div>
              <span>{money(item.price * item.qty)}</span>
            </article>
          ))}
        </div>
        <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="summary-row"><span>Delivery</span><strong>{money(items.length ? zone : 0)}</strong></div>
        {discount > 0 && <div className="summary-row" style={{ color: "var(--sage)" }}><span>Discount</span><strong>−{money(discount)}</strong></div>}
        <div className="summary-row summary-total"><span>Grand total</span><strong>{money(grandTotal)}</strong></div>
        <div className="summary-row summary-payment"><span>Payment route</span><strong>{paymentLabel}</strong></div>
        <p className="cart-note">Prices include everything currently in your bag. Adjust quantities from the bag icon before placing your order.</p>
      </aside>
    </div>
  );
}
