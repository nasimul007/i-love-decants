import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { CONFIG } from "@/lib/config";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Contact — I Love Decants"), description: t("Questions about a scent, size, gift or order? Reach I Love Decants on WhatsApp, Messenger, Facebook or phone. Friendly help, no pressure.") };
}

const FAQ = [
  ["Which size should I try?", "Begin with 3 ml if the scent is new to you. It is enough for several wears without a large commitment."],
  ["Can I add a gift note?", "Yes. A short handwritten message can be included with any gift order."],
  ["How long does engraving take?", "Custom engraving generally adds one business day after spelling and placement are confirmed."],
  ["How do I pay?", "Cash on Delivery: no advance payment, just pay the rider when your order arrives."],
  ["Do you sell full bottles?", "Our shop sells decants, perfume oils and gift sets. Message us if you are looking for a full bottle and we will tell you what we can offer."],
  ["Can you recommend a scent?", "Absolutely. Tell us two scents you enjoy, or the mood you want, and we will help you shortlist gently."],
];

export default async function ContactPage() {
  const t = await getT();
  return (
    <RouteView>
      <PageHero
        eyebrow={t("Contact us")}
        title={t("Have a doubt? We are here.")}
        lead={t("Ask about a scent, volume, gift, engraving, or order. There is no wrong question and no pressure to buy.")}
        noteTitle={t("Choose your easiest channel.")}
        note={t("Use the form, WhatsApp, Messenger, Facebook, or the fixed help button.")}
        orb="rgba(230,225,238,.88)"
      />
      <section className="section">
        <div className="container contact-layout">
          <aside className="contact-aside">
            <span className="eyebrow">{t("Direct and reassuring")}</span>
            <h2>{t("Talk to a person, not a perfume counter.")}</h2>
            <p>{t("Tell us what you usually enjoy, what you dislike, or simply the feeling you want. We will help you narrow it down calmly.")}</p>
            <div className="contact-list">
              <a href={CONFIG.whatsapp} target="_blank" rel="noreferrer"><span className="contact-list-icon">wa</span><span><strong>WhatsApp</strong><br />{t("Quick scent and order help")}</span></a>
              <a href={CONFIG.messenger} target="_blank" rel="noreferrer"><span className="contact-list-icon">ms</span><span><strong>Messenger</strong><br />{t("Ask through Facebook")}</span></a>
              <a href={`tel:${CONFIG.phoneHref}`}><span className="contact-list-icon">☎</span><span><strong>{t("Phone / SMS")}</strong><br />{CONFIG.phone}</span></a>
              <div><span className="contact-list-icon">⌖</span><span><strong>{t("Location")}</strong><br />{t(CONFIG.location)}</span></div>
            </div>
            <div className="contact-botanical" aria-hidden="true" />
          </aside>
          <ContactForm />
        </div>
      </section>
      <section className="section welcome-band" id="faq" aria-labelledby="faqTitle">
        <div className="container">
          <SectionHeading eyebrow={t("A few quick answers")} title={t("Before you need to ask.")} id="faqTitle">
            <p>{t("Short, plain answers to the questions we hear most often.")}</p>
          </SectionHeading>
          <div className="faq-grid">
            {FAQ.map(([q, a]) => <article className="faq-card" key={q}><h3>{t(q)}</h3><p>{t(a)}</p></article>)}
          </div>
        </div>
      </section>
    </RouteView>
  );
}
