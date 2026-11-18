import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = { title: "Order confirmation — I Love Decants" };

export default function OrderConfirmationPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="Order received"
        title="Thank you — we are confirming it."
        lead="Your request is saved on this device as a frontend preview. We will use the contact and delivery details you supplied to confirm it."
        noteTitle="One calm final check."
        note="Review the delivery and payment route below. No payment is processed by this downloadable frontend."
        orb="rgba(143,163,143,.34)"
      />
      <section className="section"><ConfirmationView /></section>
    </RouteView>
  );
}
