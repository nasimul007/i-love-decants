import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { CustomEngraving } from "@/components/custom/CustomEngraving";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic"; // the design photos are managed in the admin

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Custom Design — I Love Decants"), description: t("Personalise a perfume bottle with a name, date or message. Custom engraving from I Love Decants, Dhaka.") };
}

const STEPS = [
  ["Choose", "Select a 50 ml bottle and the fragrance you love."],
  ["Personalise", "Share up to 24 characters: a name, date, initials, or a short message."],
  ["Review", "We confirm spelling and placement before the final engraving begins."],
  ["Receive", "Your finished bottle arrives in calm, protective presentation packaging."],
];

export default async function CustomPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero
        eyebrow={t("Custom design")}
        title={t("Make the bottle quietly yours.")}
        lead={t("A name, a date, a private phrase, engraved with care on selected 50 ml bottles. Simple to request, easy to review, made without fuss.")}
        noteTitle={t("One extra day.")}
        note={t("Custom engraving usually adds only one business day before your order is prepared.")}
        orb="rgba(215,228,215,.85)"
      />
      <section className="section"><CustomEngraving /></section>
      <section className="section welcome-band" aria-labelledby="processTitle">
        <div className="container">
          <SectionHeading eyebrow={t("Simple and reassuring")} title={t("Four gentle steps.")} id="processTitle">
            <p>{t("You stay in control from the first idea to the final approval.")}</p>
          </SectionHeading>
          <div className="process-grid">
            {STEPS.map(([h, p], i) => (
              <article className="process-card" key={h}><span className="process-number">{i + 1}</span><h3>{t(h)}</h3><p>{t(p)}</p></article>
            ))}
          </div>
        </div>
      </section>
    </RouteView>
  );
}
