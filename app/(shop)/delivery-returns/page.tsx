import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { money } from "@/lib/format";
import { DELIVERY_CHARGE } from "@/lib/config";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Delivery & Returns — I Love Decants"), description: t("Delivery charges and times inside and outside Dhaka, Cash on Delivery, and the returns policy for decants and engraved bottles.") };
}

const DELIVERY = [
  ["Inside Dhaka city — {price}|" + money(DELIVERY_CHARGE.insideDhaka), "Usually delivered within 1–2 business days of your order being confirmed."],
  ["Outside Dhaka — {price}|" + money(DELIVERY_CHARGE.outsideDhaka), "Usually delivered within 2–4 business days, depending on your area."],
  ["Order tracking", "We will update you by phone or WhatsApp once your order ships."],
  ["Order confirmation", "Payment is Cash on Delivery: no advance payment, just pay the rider when your order arrives."],
];
const RETURNS = [
  ["Decants", "Because they are opened and filled to order, decants cannot be returned once delivered. Please ask us anything before you buy."],
  ["Sealed bottles", "Unopened bottles can be exchanged within 3 days if the seal is intact."],
  ["Custom engraving", "Personalised bottles are made to order and are not eligible for return unless a mistake was ours."],
  ["Damaged on arrival", "Message us with a photo within 24 hours of delivery and we will make it right."],
];

export default async function DeliveryReturnsPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero eyebrow={t("Delivery & return policy")} title={t("Clear from checkout to your door.")} lead={t("What to expect once you place an order, and how returns and exchanges work.")} noteTitle={t("Delivered across Bangladesh.")} note={t("Inside Dhaka in 1–2 days, outside Dhaka in 2–4 days.")} orb="rgba(234,210,212,.75)" />
      <section className="section welcome-band" aria-labelledby="deliveryTitle">
        <div className="container">
          <SectionHeading eyebrow={t("Delivery")} title={t("Two simple zones.")} id="deliveryTitle"><p>{t("Your delivery charge is shown clearly at checkout before you pay.")}</p></SectionHeading>
          <div className="faq-grid">{DELIVERY.map(([h, p]) => <article className="faq-card" key={h}><h3>{t(h.split("|")[0], { price: h.split("|")[1] ?? "" })}</h3><p>{t(p)}</p></article>)}</div>
        </div>
      </section>
      <section className="section" aria-labelledby="returnsTitle">
        <div className="container">
          <SectionHeading eyebrow={t("Returns & exchanges")} title={t("Fair, and kept simple.")} id="returnsTitle"><p>{t("We want you to feel confident ordering, even in a small size.")}</p></SectionHeading>
          <div className="faq-grid">{RETURNS.map(([h, p]) => <article className="faq-card" key={h}><h3>{t(h)}</h3><p>{t(p)}</p></article>)}</div>
        </div>
      </section>
    </RouteView>
  );
}
