import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Delivery & Returns — I Love Decants" };

const DELIVERY = [
  ["Inside Dhaka city — ৳80", "Usually delivered within 1–2 business days of your order being confirmed."],
  ["Outside Dhaka — ৳130", "Usually delivered within 2–4 business days, depending on your area."],
  ["Order tracking", "We will update you by phone, WhatsApp, or Telegram once your order ships."],
  ["Order confirmation", "Payment is Cash on Delivery: no advance payment, just pay the rider when your order arrives."],
];
const RETURNS = [
  ["Decants", "Because they are opened and filled to order, decants cannot be returned once delivered — please ask us anything before you buy."],
  ["Full bottles", "Unopened 50 ml and 100 ml bottles can be exchanged within 3 days if the seal is intact."],
  ["Custom engraving", "Personalised bottles are made to order and are not eligible for return unless a mistake was ours."],
  ["Damaged on arrival", "Message us with a photo within 24 hours of delivery and we will make it right."],
];

export default function DeliveryReturnsPage() {
  return (
    <RouteView>
      <PageHero eyebrow="Delivery & return policy" title="Clear from checkout to your door." lead="What to expect once you place an order, and how returns and exchanges work." noteTitle="Delivered across Bangladesh." note="Inside Dhaka in 1–2 days, outside Dhaka in 2–4 days." orb="rgba(234,210,212,.75)" />
      <section className="section welcome-band" aria-labelledby="deliveryTitle">
        <div className="container">
          <SectionHeading eyebrow="Delivery" title="Two simple zones." id="deliveryTitle"><p>Your delivery charge is shown clearly at checkout before you pay.</p></SectionHeading>
          <div className="faq-grid">{DELIVERY.map(([h, p]) => <article className="faq-card" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div>
        </div>
      </section>
      <section className="section" aria-labelledby="returnsTitle">
        <div className="container">
          <SectionHeading eyebrow="Returns & exchanges" title="Fair, and kept simple." id="returnsTitle"><p>We want you to feel confident ordering, even in a small size.</p></SectionHeading>
          <div className="faq-grid">{RETURNS.map(([h, p]) => <article className="faq-card" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div>
        </div>
      </section>
    </RouteView>
  );
}
