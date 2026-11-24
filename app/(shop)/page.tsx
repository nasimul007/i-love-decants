import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroSwitcher } from "@/components/home/HeroSwitcher";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedRail } from "@/components/home/FeaturedRail";
import { RouteView } from "@/components/ui/PageHero";
import { VolumeList } from "@/components/ui/VolumeText";

export default function HomePage() {
  return (
    <RouteView>
      <section className="home-hero" aria-labelledby="homeTitle">
        <HeroMist />
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title" id="homeTitle">A little scent.<br /><em>A lot of feeling.</em></h1>
            <p className="hero-description">Meet perfume without the pressure. Choose only the volume you need, anywhere from <VolumeList separator="range" />, and enjoy quiet elegance at an approachable price.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/products">Explore the collection <span aria-hidden="true">→</span></Link>
              <Link className="btn btn-secondary" href="/custom">Personalise a bottle</Link>
            </div>
            <div className="hero-promise" aria-label="Store promises">
              <span>Authentic scents</span>
              <span>Small sizes, less commitment</span>
              <span>Calm help, never pressure</span>
            </div>
          </div>
          <HeroSwitcher />
        </div>
      </section>

      <section className="section welcome-band">
        <div className="container welcome-grid">
          <div>
            <span className="eyebrow">Scent at your pace</span>
            <h2>Luxury made available.</h2>
          </div>
          <div className="welcome-copy">
            <p>Beautiful perfume should feel welcoming. Start tiny, wear it slowly, and return only when it feels right. No intimidating counters, no oversized commitment—just carefully prepared decants from authentic bottles.</p>
            <div className="value-pills" aria-label="Our qualities">
              <span className="value-pill">Lightweight</span>
              <span className="value-pill">Accessible</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="featuredTitle">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Popular, softly chosen</span>
              <h2 id="featuredTitle">Find your easy reach.</h2>
            </div>
            <div>
              <p>Swipe or scroll through favourites. Every perfume is available in <VolumeList />.</p>
              <Link className="quiet-link" href="/products">See the full collection</Link>
            </div>
          </div>
          <FeaturedRail />
        </div>
      </section>

      <section className="section-sm">
        <div className="container teaser-grid">
          <article className="teaser-card custom">
            <span className="eyebrow">Made personal</span>
            <h3>Your words, softly engraved.</h3>
            <p>Add a name, date, or private message to selected 50 ml and 100 ml bottles.</p>
            <Link className="btn btn-soft" href="/custom">Design yours</Link>
            <div className="teaser-object" aria-hidden="true">
              <div className="bottle-visual" data-shape="arch" style={{ "--liquid": "#a9b9a8", "--bottle-ink": "#435644" } as CSSProperties}>
                <div className="bottle-cap" /><div className="bottle-neck" /><div className="bottle-body" />
                <div className="bottle-label"><strong>For You</strong><small>Engraved</small></div>
              </div>
            </div>
          </article>

          <article className="teaser-card gift">
            <span className="eyebrow">Thoughtfully ready</span>
            <h3>A gift that feels like them.</h3>
            <p>Curated sets, soft cartons, gift wrapping, and handwritten messages—without the pressure.</p>
            <Link className="btn btn-secondary" href="/products?tab=gifts">Visit gift corner</Link>
            <div className="gift-box-art" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section className="trust-strip" aria-label="Why shop with us">
        <div className="container trust-grid">
          <div className="trust-item"><strong>Choose your volume</strong><span><VolumeList separator="ml-list" />.</span></div>
          <div className="trust-item"><strong>Pay only for more</strong><span>Clear size-by-size pricing before you add.</span></div>
          <div className="trust-item"><strong>Prepared with care</strong><span>Clean presentation and protective packaging.</span></div>
          <div className="trust-item"><strong>Have a doubt?</strong><span>Talk to a real person through your favourite channel.</span></div>
        </div>
      </section>

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
