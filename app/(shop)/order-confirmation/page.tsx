import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Order confirmation — I Love Decants"), robots: { index: false } };
}

export default async function OrderConfirmationPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero
        eyebrow={t("Order received")}
        title={t("Thank you. We are confirming it.")}
        lead={t("Your order is saved. We will use the contact and delivery details you supplied to confirm it. Signed-in customers can follow its status from My account.")}
        noteTitle={t("One calm final check.")}
        note={t("Review the delivery details below. You pay in cash when the order arrives.")}
        orb="rgba(143,163,143,.34)"
      />
      <section className="section"><ConfirmationView /></section>
    </RouteView>
  );
}
