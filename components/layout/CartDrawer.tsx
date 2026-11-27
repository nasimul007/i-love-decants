"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/ui/Icons";
import { useUI } from "@/components/providers/UIProvider";
import { useCart } from "@/hooks/useServices";
import { VolumeList } from "@/components/ui/VolumeText";
import { money } from "@/lib/format";
import { BULK_DISCOUNT, DELIVERY_CHARGE, bulkDiscountFor } from "@/lib/config";

export function CartDrawer() {
  const router = useRouter();
  const { cartOpen, closeCart } = useUI();
  const { items, subtotal, service } = useCart();
  const t = useT();

  return (
    <>
      <div className={`drawer-overlay${cartOpen ? " is-open" : ""}`} onClick={closeCart} />
      <aside className={`cart-drawer${cartOpen ? " is-open" : ""}`} id="cartDrawer" aria-hidden={!cartOpen} aria-label={t("Shopping bag")}>
        <div className="cart-drawer-header">
          <h2>{t("Your bag")}</h2>
          <button className="icon-btn" type="button" aria-label={t("Close shopping bag")} onClick={closeCart}><CloseIcon /></button>
        </div>
        <div className="cart-items">
          {!items.length && (
            <div className="cart-empty"><div><strong>{t("Your bag is resting")}</strong><span>{t("Add any size from")} <VolumeList separator="range" /> {t("when you are ready.")}</span></div></div>
          )}
          {items.map((item) => (
            <article className="cart-item" key={item.key}>
              <span className="cart-item-swatch" style={{ ["--swatch" as string]: item.swatch || "#ead2d4" }} />
              <div>
                <strong>{item.name}</strong>
                <small>{item.detail?.split(" · ").map((d) => t(d).replace("Full bottle", t("Full bottle"))).join(" · ")}</small>
                <div className="cart-item-actions">
                  <button className="qty-button" type="button" aria-label={t("Decrease quantity")} onClick={() => service.setQty(item.key, item.qty - 1)}>−</button>
                  <small>{item.qty}</small>
                  <button className="qty-button" type="button" aria-label={t("Increase quantity")} onClick={() => service.setQty(item.key, item.qty + 1)}>+</button>
                  <button className="remove-button" type="button" onClick={() => service.remove(item.key)}>{t("Remove")}</button>
                </div>
              </div>
              <span className="cart-item-price">{money(item.price * item.qty)}</span>
            </article>
          ))}
        </div>
        <div className="cart-summary">
          <div className="summary-row"><span>{t("Subtotal")}</span><strong>{money(subtotal)}</strong></div>
          {bulkDiscountFor(subtotal) > 0
            ? <div className="summary-row is-deal"><span>{t("Large-order discount ({pct}%)", { pct: BULK_DISCOUNT.percent })}</span><strong>−{money(bulkDiscountFor(subtotal))}</strong></div>
            : items.length > 0 && <p className="deal-note">{t("Add {amount} more to get {pct}% off your order.", { amount: money(BULK_DISCOUNT.minSubtotal - subtotal), pct: BULK_DISCOUNT.percent })}</p>}
          <p className="cart-note">{t("Delivery: {inside} inside Dhaka, {outside} elsewhere. Pay cash on delivery, no advance payment. Discount codes go in at checkout.", { inside: money(DELIVERY_CHARGE.insideDhaka), outside: money(DELIVERY_CHARGE.outsideDhaka) })}</p>
          <button className="btn btn-primary" type="button" disabled={!items.length} onClick={() => { closeCart(); router.push("/checkout"); }}>
            {t("Continue to checkout")}
          </button>
        </div>
      </aside>
    </>
  );
}
