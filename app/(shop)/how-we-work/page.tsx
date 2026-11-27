import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("How we work — I Love Decants"), description: t("How I Love Decants prepares, packs and delivers authentic perfume decants across Bangladesh.") };
}

const STEPS = [
  ["You choose", "Pick a scent, a volume from 3 ml to 50 ml, or a gift set that fits the moment."],
  ["We prepare", "Each decant is filled from an authenticated bottle and sealed the same day."],
  ["We pack with care", "Protective packaging, a gift note if you'd like one, and nothing bulky or wasteful."],
  ["You receive it", "Delivered across Bangladesh, with support open on WhatsApp or Messenger."],
];
const WHY = [
  ["Authenticity first", "Every decant is drawn from a genuine, verified bottle. Never a copy or a blend."],
  ["Only what you need", "Five sizes mean you are never paying for more perfume than you will use."],
  ["Real answers", "Message us before you buy. We would rather you ask than guess."],
];

export default async function HowWeWorkPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero eyebrow={t("How we work")} title={t("From decant to doorstep.")} lead={t("A small, careful process behind every bottle we prepare: nothing rushed, nothing oversized.")} noteTitle={t("Small batches, checked by hand.")} note={t("Every decant is filled, labelled, and inspected before it leaves us.")} orb="rgba(226,233,225,.75)" />
      <section className="section welcome-band" aria-labelledby="howWeWorkTitle">
        <div className="container">
          <SectionHeading eyebrow={t("Simple, start to finish")} title={t("Four steps, quietly done.")} id="howWeWorkTitle">
            <p>{t("The same calm approach whether you’re trying a 3 ml decant or gifting a curated set.")}</p>
          </SectionHeading>
          <div className="process-grid">
            {STEPS.map(([h, p], i) => <article className="process-card" key={h}><span className="process-number">{i + 1}</span><h3>{t(h)}</h3><p>{t(p)}</p></article>)}
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="whyTitle">
        <div className="container">
          <SectionHeading eyebrow={t("Why it feels different")} title={t("No pressure, just help.")} id="whyTitle">
            <p>{t("We would rather you try a small size and love it than commit early and wonder.")}</p>
          </SectionHeading>
          <div className="faq-grid">{WHY.map(([h, p]) => <article className="faq-card" key={h}><h3>{t(h)}</h3><p>{t(p)}</p></article>)}</div>
        </div>
      </section>
    </RouteView>
  );
}
