"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { usePathname } from "next/navigation";
import { CartIcon } from "@/components/ui/Icons";
import { useUI } from "@/components/providers/UIProvider";
import { useCart } from "@/hooks/useServices";

/**
 * Floating bag above the chat button: a constant reminder while scrolling that the bag has items.
 * Only shows when the bag has something in it; hidden on checkout (already there) and while the bag or the chat menu is open.
 */
export function FloatingBag() {
  const { count } = useCart();
  const { openCart, cartOpen, chatOpen } = useUI();
  const path = usePathname();
  const t = useT();
  if (!count || cartOpen || chatOpen || path?.startsWith("/checkout")) return null; // chat menu opens upward over this spot
  return (
    // key={count}: re-mounting replays the "bump" whenever an item is added or removed
    <button key={count} className="floating-bag" type="button" onClick={openCart} aria-label={t(count === 1 ? "Open your bag, {n} item" : "Open your bag, {n} items", { n: count })}>
      <CartIcon />
      <span className="cart-count" aria-hidden="true">{count}</span>
    </button>
  );
}
