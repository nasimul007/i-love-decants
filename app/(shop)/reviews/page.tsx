import type { Metadata } from "next";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { ReviewsBrowser } from "@/components/reviews/ReviewsBrowser";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { listReviews, productName, reviewStats } from "@/lib/server/reviews";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Customer reviews — I Love Decants"), description: t("Real reviews of I Love Decants perfume decants, oils and gift sets from customers across Bangladesh: on our website, WhatsApp and Facebook.") };
}

type Props = { searchParams: Promise<{ product?: string; write?: string }> };

// No shop-wide review star markup on purpose: Google shows no stars for a shop's reviews of itself on its own site.
// Product ratings are marked up on the shop page instead (app/(shop)/products/page.tsx).
export default async function ReviewsPage({ searchParams }: Props) {
  const { product: productId = "", write = "" } = await searchParams;
  const t = await getT();
  const name = productId ? await productName(productId).catch(() => null) : null;
  const scope = productId && name ? { id: productId, name } : undefined;
  const reviews = await listReviews("published", scope?.id).catch(() => []);
  const s = reviewStats(scope ? await listReviews("published").catch(() => []) : reviews);
  return (
    <RouteView>
      <PageHero
        eyebrow={t("Customer reviews")}
        title={t("Kind words, honestly shared.")}
        lead={t("What customers say after trying our decants, oils and gift sets: written here on the website, or sent to us on WhatsApp and Facebook.")}
        noteTitle={s.count ? t("{avg} out of 5", { avg: s.average.toFixed(1) }) : t("Be the first.")}
        note={s.count ? t(s.count === 1 ? "From {n} review. Reviews from Facebook open the original post." : "From {n} reviews. Reviews from Facebook open the original post.", { n: s.count }) : t("Tried one of our scents? Your review helps the next person choose.")}
        orb="rgba(234,210,212,.8)"
        compact
      />
      <section className="section" aria-labelledby="reviewsTitle">
        <div className="container"><SectionHeading eyebrow={scope ? scope.name : t("All reviews")} title={t("From people who tried them.")} id="reviewsTitle" /></div>
        <ReviewsBrowser
          reviews={reviews}
          product={scope}
          side={
            <div className="review-write" id="write">
              <h2>{t("Write a review")}</h2>
              <p>{t("Shown here once we have checked it. No links, please.")}</p>
              <ReviewForm defaultProduct={write || scope?.id || ""} />
            </div>
          }
        />
      </section>
    </RouteView>
  );
}
