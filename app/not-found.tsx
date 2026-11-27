import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, RouteView } from "@/components/ui/PageHero";
import { getPrefs, getT } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Page not found — I Love Decants"), robots: { index: false } };
}

/** Any unknown URL: the normal header and footer, a plain message, and the way back. */
export default async function NotFound() {
  const prefs = await getPrefs();
  const t = translator(prefs.lang);
  return (
    <SiteShell {...prefs}>
      <RouteView>
        <PageHero
          eyebrow={t("Page not found")}
          title={t("This page has drifted away.")}
          lead={t("The link may be old or mistyped. Everything we sell is still one tap away.")}
          noteTitle={t("Try the shop.")}
          note={t("Decants from 3 ml, perfume oils and gift sets, all cash on delivery.")}
          orb="rgba(216,169,184,.3)"
        />
        <section><div className="container" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", paddingTop: "1.5rem", paddingBottom: "4rem" }}>
          <Link className="btn btn-primary" href="/products">{t("Browse perfumes")}</Link>
          <Link className="btn btn-secondary" href="/">{t("Back to home")}</Link>
        </div></section>
      </RouteView>
    </SiteShell>
  );
}
