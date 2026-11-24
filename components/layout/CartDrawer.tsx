"use client";

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

  return (
    <>
      <div className={`drawer-overlay${cartOpen ? " is-open" : ""}`} onClick={closeCart} />
      <aside className={`cart-drawer${cartOpen ? " is-open" : ""}`} id="cartDrawer" aria-hidden={!cartOpen} aria-label="Shopping bag">
        <div className="cart-drawer-header">
          <h2>Your bag</h2>
          <button className="icon-btn" type="button" aria-label="Close shopping bag" onClick={closeCart}><CloseIcon /></button>
        </div>
        <div className="cart-items">
          {!items.length && (
            <div className="cart-empty"><div><strong>Your bag is resting</strong><span>Add any size from <VolumeList separator="range" /> when you are ready.</span></div></div>
          )}
          {items.map((item) => (
            <article className="cart-item" key={item.key}>
              <span className="cart-item-swatch" style={{ ["--swatch" as string]: item.swatch || "#ead2d4" }} />
              <div>
                <strong>{item.name}</strong>
                <small>{item.detail}</small>
                <div className="cart-item-actions">
                  <button className="qty-button" type="button" aria-label="Decrease quantity" onClick={() => service.setQty(item.key, item.qty - 1)}>−</button>
                  <small>{item.qty}</small>
                  <button className="qty-button" type="button" aria-label="Increase quantity" onClick={() => service.setQty(item.key, item.qty + 1)}>+</button>
                  <button className="remove-button" type="button" onClick={() => service.remove(item.key)}>Remove</button>
                </div>
              </div>
              <span className="cart-item-price">{money(item.price * item.qty)}</span>
            </article>
          ))}
        </div>
        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          {bulkDiscountFor(subtotal) > 0
            ? <div className="summary-row is-deal"><span>Large-order discount ({BULK_DISCOUNT.percent}%)</span><strong>−{money(bulkDiscountFor(subtotal))}</strong></div>
            : items.length > 0 && <p className="deal-note">Add {money(BULK_DISCOUNT.minSubtotal - subtotal)} more to get {BULK_DISCOUNT.percent}% off your order.</p>}
          <p className="cart-note">Delivery: {money(DELIVERY_CHARGE.insideDhaka)} inside Dhaka, {money(DELIVERY_CHARGE.outsideDhaka)} elsewhere. Pay cash on delivery, no advance payment. Discount codes go in at checkout.</p>
          <button className="btn btn-primary" type="button" disabled={!items.length} onClick={() => { closeCart(); router.push("/checkout"); }}>
            Continue to checkout
          </button>
        </div>
      </aside>
    </>
  );
}
