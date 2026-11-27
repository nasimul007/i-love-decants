import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { FaqSection } from "@/components/home/FaqSection";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { FeaturedRail } from "@/components/home/FeaturedRail";
import { RouteView } from "@/components/ui/PageHero";
import { VolumeList } from "@/components/ui/VolumeText";
import { FromPrice } from "@/components/home/FromPrice";
import { money } from "@/lib/format";
import { DELIVERY_CHARGE } from "@/lib/config";
import { getT } from "@/lib/i18n/server";

export default async function HomePage() {
  const t = await getT();
  return (
    <RouteView>
      <section className="home-hero" aria-labelledby="homeTitle">
        <HeroMist />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{t("Authentic perfume decants · Delivered across Bangladesh")}</span>
            <h1 className="hero-title" id="homeTitle">{t("A little scent.")}<br /><em>{t("A lot of feeling.")}</em></h1>
            <p className="hero-description">{t("Try authentic perfumes in small sizes,")} <VolumeList separator="range" />{t(".")} {t("Pay only for what you will actually wear.")}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/products">{t("Shop decants")}<FromPrice /> <span aria-hidden="true">→</span></Link>
              <Link className="btn btn-secondary" href="/custom">{t("Personalise a bottle")}</Link>
            </div>
            <div className="hero-promise" aria-label={t("Store promises")}>
              <span>{t("Cash on delivery, no advance payment")}</span>
              <span>{t("{price} delivery inside Dhaka", { price: money(DELIVERY_CHARGE.insideDhaka) })}</span>
              <span>{t("Poured from original bottles")}</span>
            </div>
          </div>
          <HeroSwitcher />
        </div>
      </section>

      <section className="section welcome-band">
        <div className="container welcome-grid">
          <div>
            <span className="eyebrow">{t("Scent at your pace")}</span>
            <h2>{t("Luxury made available.")}</h2>
          </div>
          <div className="welcome-copy">
            <p>{t("Beautiful perfume should feel welcoming. Start tiny, wear it slowly, and return only when it feels right. No intimidating counters, no oversized commitment. Just carefully prepared decants from authentic bottles.")}</p>
            <div className="value-pills" aria-label={t("Our qualities")}>
              <span className="value-pill">{t("Lightweight")}</span>
              <span className="value-pill">{t("Accessible")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="featuredTitle">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("Popular, softly chosen")}</span>
              <h2 id="featuredTitle">{t("Find your easy reach.")}</h2>
            </div>
            <div>
              <p>{t("Swipe or scroll through favourites. Sizes range from")} <VolumeList separator="range" />{t("; each perfume shows the sizes it comes in.")}</p>
              <Link className="quiet-link" href="/products">{t("See the full collection")}</Link>
            </div>
          </div>
          <FeaturedRail />
        </div>
      </section>

      <section className="section-sm">
        <div className="container teaser-grid">
          <article className="teaser-card custom">
            <span className="eyebrow">{t("Made personal")}</span>
            <h3>{t("Your words, softly engraved.")}</h3>
            <p>{t("Add a name, date, or private message to selected 50 ml bottles.")}</p>
            <Link className="btn btn-soft" href="/custom">{t("Design yours")}</Link>
            <div className="teaser-object" aria-hidden="true">
              <div className="bottle-visual" data-shape="arch" style={{ "--liquid": "#a9b9a8", "--bottle-ink": "#435644" } as CSSProperties}>
                <div className="bottle-cap" /><div className="bottle-neck" /><div className="bottle-body" />
                <div className="bottle-label"><strong>{t("For You")}</strong><small>{t("Engraved")}</small></div>
              </div>
            </div>
          </article>

          <article className="teaser-card gift">
            <span className="eyebrow">{t("Thoughtfully ready")}</span>
            <h3>{t("A gift that feels like them.")}</h3>
            <p>{t("Curated sets, soft cartons, gift wrapping, and handwritten messages, without the pressure.")}</p>
            <Link className="btn btn-secondary" href="/products?tab=gifts">{t("Visit gift corner")}</Link>
            <div className="gift-box-art" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section className="trust-strip" aria-label={t("Why shop with us")}>
        <div className="container trust-grid">
          <div className="trust-item"><strong>{t("Choose your volume")}</strong><span><VolumeList separator="ml-list" />{t(".")}</span></div>
          <div className="trust-item"><strong>{t("Pay only for more")}</strong><span>{t("Clear size-by-size pricing before you add.")}</span></div>
          <div className="trust-item"><strong>{t("Prepared with care")}</strong><span>{t("Clean presentation and protective packaging.")}</span></div>
          <div className="trust-item"><strong>{t("Have a doubt?")}</strong><span>{t("Talk to a real person through your favourite channel.")}</span></div>
        </div>
      </section>

      <ReviewsStrip />
      <FaqSection />
    </RouteView>
  );
}

const ORBS = [
  ["12%", "16%", "170px", "rgba(234,210,212,.5)", "11s"],
  ["76%", "8%", "220px", "rgba(226,233,225,.55)", "14s"],
  ["68%", "67%", "190px", "rgba(238,234,243,.62)", "12s"],
  ["18%", "72%", "145px", "rgba(238,227,216,.65)", "15s"],
];

function HeroMist() {
  return (
    <div className="hero-mist" aria-hidden="true">
      {ORBS.map(([left, top, size, tone, speed]) => (
        <span key={left + top} className="mist-orb" style={{ left, top, "--size": size, "--tone": tone, "--speed": speed } as CSSProperties} />
      ))}
    </div>
  );
}
