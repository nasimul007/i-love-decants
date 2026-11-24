import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "How we work — I Love Decants", description: "How I Love Decants prepares, packs and delivers authentic perfume decants across Bangladesh." };

const STEPS = [
  ["You choose", "Pick a scent, a volume from 3 ml to 100 ml, or a gift set that fits the moment."],
  ["We prepare", "Each decant is filled from an authenticated bottle and sealed the same day."],
  ["We pack with care", "Protective packaging, a gift note if you'd like one, and nothing bulky or wasteful."],
  ["You receive it", "Delivered across Bangladesh, with support open on WhatsApp or Messenger."],
];
const WHY = [
  ["Authenticity first", "Every decant is drawn from a genuine, verified bottle — never a copy or a blend."],
  ["Only what you need", "Six sizes mean you are never paying for more perfume than you will use."],
  ["Real answers", "Message us before you buy — we would rather you ask than guess."],
];

export default function HowWeWorkPage() {
  return (
    <RouteView>
      <PageHero eyebrow="How we work" title="From decant to doorstep." lead="A small, careful process behind every bottle we prepare — nothing rushed, nothing oversized." noteTitle="Small batches, checked by hand." note="Every decant is filled, labelled, and inspected before it leaves us." orb="rgba(226,233,225,.75)" />
      <section className="section welcome-band" aria-labelledby="howWeWorkTitle">
        <div className="container">
          <SectionHeading eyebrow="Simple, start to finish" title="Four steps, quietly done." id="howWeWorkTitle">
            <p>The same calm approach whether you&apos;re trying a 3&nbsp;ml decant or gifting a full bottle.</p>
          </SectionHeading>
          <div className="process-grid">
            {STEPS.map(([h, p], i) => <article className="process-card" key={h}><span className="process-number">{i + 1}</span><h3>{h}</h3><p>{p}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="whyTitle">
        <div className="container">
          <SectionHeading eyebrow="Why it feels different" title="No pressure, just help." id="whyTitle">
            <p>We would rather you try a small size and love it than commit early and wonder.</p>
          </SectionHeading>
          <div className="faq-grid">{WHY.map(([h, p]) => <article className="faq-card" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div>
        </div>
      </section>
    </RouteView>
  );
}
