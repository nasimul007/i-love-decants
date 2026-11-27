import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { FaqSection } from "@/components/home/FaqSection";
import { db } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic"; // questions are edited in the admin
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("FAQ — I Love Decants"), description: t("Answers about perfume decants, authenticity, sizes, delivery charges inside and outside Dhaka, cash on delivery and discount codes at I Love Decants.") };
}

/** The same questions as the home page FAQ, on their own page (rendered on the server; no FAQ schema: Google retired FAQ rich results). */
export default async function FaqPage() {
  const t = await getT();
  const faqs = await db.faq.findMany({ where: { enabled: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] })
    .then((rows) => rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))).catch(() => []);
  return (
    <RouteView>
      <PageHero
        eyebrow={t("FAQ")}
        title={t("Good to know, before you order.")}
        lead={t("Decants, sizes, delivery, payment and discount codes: the questions customers ask us most, answered in one place.")}
        noteTitle={t("Still wondering?")}
        note={t("Message us on WhatsApp or Messenger. There is no wrong question.")}
        orb="rgba(238,234,243,.9)"
        compact
      />
      {faqs.length ? <FaqSection initial={faqs} onPage /> : <section className="section"><div className="container"><p className="acct-empty">{t("No questions yet.")}</p></div></section>}
      <section className="section faq-more" aria-label={t("More help")}>
        <div className="container faq-more-row">
          <a className="cta-wa-btn" href={CONFIG.whatsapp} target="_blank" rel="noreferrer"><WhatsAppIcon className="cta-btn-icon" />{t("Ask on WhatsApp")}</a>
          <Link className="btn btn-secondary" href="/contact">{t("Other ways to reach us")}</Link>
          <Link className="btn btn-secondary" href="/how-decants-work">{t("How decants work")}</Link>
        </div>
      </section>
    </RouteView>
  );
}
