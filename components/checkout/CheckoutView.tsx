"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useCart, useCurrentCustomer } from "@/hooks/useServices";
import { couponService } from "@/lib/services/coupons";
import { ordersApi } from "@/lib/api/orders";
import { BULK_DISCOUNT, DELIVERY_CHARGE, bulkDiscountFor, deliveryChargeFor } from "@/lib/config";
import { BD_CITIES } from "@/lib/data/cities";
import { CheckoutProgress } from "./CheckoutProgress";
import { CitySelect } from "./CitySelect";
import { toLocalPhone, isBdPhone, isPersonName, NAME_ERROR } from "@/lib/validators";
import { money } from "@/lib/format";
import type { Coupon } from "@/types";

type Field = "fullName" | "phone" | "address" | "city";

export function CheckoutView() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const customer = useCurrentCustomer();

  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", notes: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  // Same rules the server applies (it recalculates everything when the order is placed).
  const delivery = items.length && form.city ? deliveryChargeFor(form.city) : 0;
  const bulk = bulkDiscountFor(subtotal);
  const discount = couponService.discount(coupon, subtotal - bulk);
  const grandTotal = Math.max(0, subtotal - bulk - discount) + delivery;
  const toBulk = BULK_DISCOUNT.minSubtotal - subtotal;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponMsg({ text: "Please enter a discount code.", ok: false }); return; }
    const phone = isBdPhone(form.phone) ? form.phone : undefined; // each code can be used once per phone number
    const res = await ordersApi.validateCoupon(code, items, phone);
    if (!res.ok || !res.data) {
      setCoupon(null);
      setCouponMsg({ text: res.error ?? "Code not recognised. Check the spelling and try again.", ok: false });
      return;
    }
    const found: Coupon = { code: res.data.code, type: res.data.type, value: res.data.value, active: true };
    setCoupon(found);
    const label = found.type === "percent" ? `${found.value}% off` : `৳${found.value} off`;
    setCouponMsg({ text: `✓ ${code} applied: ${label} (−${money(res.data.discount)}). One use per phone number.`, ok: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length || submitted) return; // ignore double clicks while the order is being placed
    const next: Partial<Record<Field, string>> = {};
    const required = "Please fill in this field.";
    if (!form.fullName.trim()) next.fullName = required;
    else if (!isPersonName(form.fullName)) next.fullName = NAME_ERROR;
    if (!form.phone.trim()) next.phone = required;
    else if (!isBdPhone(form.phone)) next.phone = "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
    if (!form.address.trim()) next.address = required;
    if (!form.city) next.city = "Please choose your city.";
    setErrors(next);
    if (Object.keys(next).length) {
      setFormError("Please complete the highlighted fields before confirming.");
      // Take the shopper to the first field that needs fixing (it is usually scrolled out of view).
      const first = (["fullName", "phone", "address", "city"] as const).find((k) => next[k]);
      const el = first && document.getElementById({ fullName: "checkoutName", phone: "checkoutPhone", address: "checkoutAddress", city: "checkoutCity" }[first]);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }
    setFormError("");

    setSubmitted(true);
    const res = await ordersApi.place({
      customer: { name: form.fullName.trim(), phone: form.phone.trim() },
      delivery: { address: form.address.trim(), city: form.city, notes: form.notes.trim() },
      items,
      couponCode: coupon?.code ?? null,
    });
    if (!res.ok) { setSubmitted(false); setFormError(res.error ?? "Could not place your order."); return; }
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
    <>
    <div className="container"><CheckoutProgress /></div>
    <div className="container checkout-layout">
      <form className="checkout-form-card" onSubmit={submit} noValidate>
        <p className="required-note"><span className="req" aria-hidden="true">*</span> Required</p>
        <div className="checkout-block">
          <span className="eyebrow">Step 1</span>
          <h2>Customer information</h2>
          <div className="form-grid">
            <div className="field"><label htmlFor="checkoutName">Full name<Req /></label><input id="checkoutName" aria-required="true" autoComplete="name" type="text" placeholder="Your full name" {...text("fullName")} />{err("fullName")}</div>
            <div className="field"><label htmlFor="checkoutPhone">Phone number<Req /></label><input id="checkoutPhone" aria-required="true" autoComplete="tel" type="tel" inputMode="numeric" maxLength={11} pattern="01[0-9]{9}" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: toLocalPhone(e.target.value) })} />{err("phone")}</div>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 2</span>
          <h2>Delivery details</h2>
          <div className="form-grid">
            <div className="field full"><label htmlFor="checkoutAddress">Full delivery address<Req /></label><textarea id="checkoutAddress" aria-required="true" autoComplete="street-address" placeholder="House, road, area, landmark…" {...text("address")} />{err("address")}</div>
            <div className="field">
              <label htmlFor="checkoutCity">City<Req /></label>
              <CitySelect id="checkoutCity" value={form.city} options={BD_CITIES} onChange={(city) => setForm({ ...form, city })} />
              {err("city")}
            </div>
            <div className="field">
              <label htmlFor="deliveryCharge">Delivery charge</label>
              <input id="deliveryCharge" type="text" readOnly value={form.city ? `${money(deliveryChargeFor(form.city))} · ${deliveryChargeFor(form.city) === DELIVERY_CHARGE.insideDhaka ? "Inside Dhaka city" : "Outside Dhaka"}` : "Choose a city to see the charge"} />
            </div>
            <div className="field full"><label htmlFor="deliveryNote">Delivery notes <small>(optional)</small></label><textarea id="deliveryNote" placeholder="Preferred time, landmark, gift note, or anything helpful…" {...text("notes")} /></div>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 3</span>
          <h2>Payment</h2>
          <p className="wallet-hint">Cash on Delivery is our payment option: no advance payment needed. Pay the rider when your order arrives.</p>
          <div className="payment-methods" role="radiogroup" aria-label="Payment type">
            <label className="payment-option payment-option--cash">
              <input type="radio" name="paymentMethod" value="cod" checked readOnly />
              <span className="payment-mark" style={{ ["--pay-tint" as string]: "#8ca390" }} />
              <span className="payment-label"><strong>Cash on Delivery</strong><small>Pay in cash when your order arrives</small></span>
            </label>
          </div>
        </div>

        <div className="checkout-block">
          <span className="eyebrow">Step 4 (optional)</span>
          <h2>Discount code</h2>
          <div className="coupon-row">
            <div className="field">
              <label htmlFor="couponInput">Have a code?</label>
              <input
                id="couponInput" type="text" placeholder="Enter your code" autoComplete="off" style={{ textTransform: "uppercase" }}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
              />
            </div>
            <button className="coupon-apply-btn" type="button" onClick={applyCoupon}>Apply</button>
          </div>
          <p className={`coupon-status${couponMsg ? (couponMsg.ok ? " ok" : " err") : ""}`}>{couponMsg?.text}</p>
        </div>

        <button className="btn btn-primary btn-loading" type="submit" disabled={submitted} aria-busy={submitted}>
          {submitted ? <><span className="btn-spinner" aria-hidden="true" />Placing your order…</> : "Place order, pay on delivery"}
        </button>
        {submitted && <p className="placing-note" role="status">Please wait and don’t close this page. This can take a few seconds.</p>}
        <div className={`form-status${formError ? " is-visible is-error" : ""}`} role="alert">{formError}</div>
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
        {bulk > 0 && <div className="summary-row is-deal"><span>Large-order discount ({BULK_DISCOUNT.percent}%)</span><strong>−{money(bulk)}</strong></div>}
        {discount > 0 && <div className="summary-row is-deal"><span>Discount code{coupon ? ` (${coupon.code})` : ""}</span><strong>−{money(discount)}</strong></div>}
        <div className="summary-row"><span>Delivery</span><strong>{form.city ? money(delivery) : "Choose city"}</strong></div>
        <div className="summary-row summary-total"><span>Grand total</span><strong>{money(grandTotal)}</strong></div>
        <div className="summary-row summary-payment"><span>Payment</span><strong>Cash on Delivery</strong></div>
        {bulk === 0 && items.length > 0 && <p className="deal-note">Add {money(toBulk)} more to get {BULK_DISCOUNT.percent}% off your order.</p>}
        <p className="cart-note">Prices include everything currently in your bag. Adjust quantities from the bag icon before placing your order.</p>
      </aside>
    </div>
    </>
  );
}

/** Required-field star (the label text stays the accessible name; aria-required carries the meaning). */
const Req = () => <span className="req" aria-hidden="true">*</span>;
