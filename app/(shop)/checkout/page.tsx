import type { Metadata } from "next";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { money } from "@/lib/format";
import { BULK_DISCOUNT, DELIVERY_CHARGE } from "@/lib/config";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Checkout — I Love Decants"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero
        eyebrow={t("Checkout")}
        title={t("Complete your order.")}
        lead={t("Confirm your delivery details before placing your order. You pay in cash when it arrives. Your live order preview stays beside the form.")}
        noteTitle={t("Clear before you confirm.")}
        note={t("Inside Dhaka city delivery is {inside}; outside Dhaka it is {outside}. Orders of {min}+ get {pct}% off. Your total updates instantly.", { inside: money(DELIVERY_CHARGE.insideDhaka), outside: money(DELIVERY_CHARGE.outsideDhaka), min: money(BULK_DISCOUNT.minSubtotal), pct: BULK_DISCOUNT.percent })}
        orb="rgba(216,197,118,.28)"
        compact
      />
      <section className="section"><CheckoutView /></section>
    </RouteView>
  );
}
