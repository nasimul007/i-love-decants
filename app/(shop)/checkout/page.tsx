import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { money } from "@/lib/format";
import { BULK_DISCOUNT, DELIVERY_CHARGE } from "@/lib/config";

export const metadata: Metadata = { title: "Checkout — I Love Decants", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="Checkout"
        title="Complete your order."
        lead="Confirm your delivery details before placing your order. You pay in cash when it arrives. Your live order preview stays beside the form."
        noteTitle="Clear before you confirm."
        note={`Inside Dhaka city delivery is ${money(DELIVERY_CHARGE.insideDhaka)}; outside Dhaka it is ${money(DELIVERY_CHARGE.outsideDhaka)}. Orders of ${money(BULK_DISCOUNT.minSubtotal)}+ get ${BULK_DISCOUNT.percent}% off. Your total updates instantly.`}
        orb="rgba(216,197,118,.28)"
        compact
      />
      <section className="section"><CheckoutView /></section>
    </RouteView>
  );
}
