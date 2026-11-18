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
        lead="Confirm delivery, location, and your preferred payment option before placing your order. Your live order preview stays beside the form."
        noteTitle="Clear before you confirm."
        note="Inside Dhaka delivery is ৳100; outside Dhaka delivery is ৳150. Your total updates instantly."
        orb="rgba(216,197,118,.28)"
      />
      <section className="section"><CheckoutView /></section>
    </RouteView>
  );
}
