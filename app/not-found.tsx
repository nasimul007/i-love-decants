import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero, RouteView } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Page not found — I Love Decants", robots: { index: false } };

/** Any unknown URL: the normal header and footer, a plain message, and the way back. */
export default function NotFound() {
  return (
    <SiteShell>
      <RouteView>
        <PageHero
          eyebrow="Page not found"
          title="This page has drifted away."
          lead="The link may be old or mistyped. Everything we sell is still one tap away."
          noteTitle="Try the shop."
          note="Decants from 3 ml, perfume oils and gift sets, all cash on delivery."
          orb="rgba(216,169,184,.3)"
        />
        <section><div className="container" style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", paddingTop: "1.5rem", paddingBottom: "4rem" }}>
          <Link className="btn btn-primary" href="/products">Browse perfumes</Link>
          <Link className="btn btn-secondary" href="/">Back to home</Link>
        </div></section>
      </RouteView>
    </SiteShell>
  );
}
