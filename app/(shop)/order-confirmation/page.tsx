import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = { title: "Order confirmation — I Love Decants", robots: { index: false } };

export default function OrderConfirmationPage() {
  return (
    <RouteView>
      <PageHero
        eyebrow="Order received"
        title="Thank you — we are confirming it."
        lead="Your order is saved. We will use the contact and delivery details you supplied to confirm it. Signed-in customers can follow its status from My account."
        noteTitle="One calm final check."
        note="Review the delivery details below. You pay in cash when the order arrives."
        orb="rgba(143,163,143,.34)"
      />
      <section className="section"><ConfirmationView /></section>
    </RouteView>
  );
}
