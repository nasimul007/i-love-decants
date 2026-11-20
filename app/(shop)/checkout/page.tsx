import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout — I Love Decants" };

export default function CheckoutPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="Checkout"
        title="Complete your order."
        lead="Confirm your delivery details before placing your order. You pay in cash when it arrives. Your live order preview stays beside the form."
        noteTitle="Clear before you confirm."
        note="Inside Dhaka city delivery is ৳80; outside Dhaka it is ৳130. Orders of ৳5,000+ get 10% off. Your total updates instantly."
        orb="rgba(216,197,118,.28)"
      />
      <section className="section"><CheckoutView /></section>
    </RouteView>
  );
}
