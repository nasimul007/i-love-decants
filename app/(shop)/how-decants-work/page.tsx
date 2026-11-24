import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHero, RouteView, SectionHeading } from "@/components/ui/PageHero";
import { VolumeList } from "@/components/ui/VolumeText";

export const metadata: Metadata = { title: "How decants work — I Love Decants", description: "What a perfume decant is, which sizes to choose, and how to store it so it lasts as long as the original bottle." };

const BASICS: [string, ReactNode][] = [
  ["What is a decant?", "A small portion of an original, authentic perfume transferred into a travel-friendly bottle."],
  ["Why choose one?", "You get to properly wear a scent for days before deciding whether a full bottle is worth it."],
  ["Sizes available", <>Choose from <VolumeList />, each priced size by size.</>],
  ["How long do they last?", "Stored away from heat and direct light, a decant keeps just as well as the original bottle."],
];
const CARE = [
  ["Keep it cool", "Store away from direct sunlight, heat, and steamy bathrooms."],
  ["Keep it upright", "Standing bottles reduce air contact and help the scent stay true."],
  ["Test on skin", "Fragrance shifts slightly with your skin's chemistry — always worth a proper wear."],
  ["Ask us anything", "Unsure between two scents? Tell us what you enjoy and we will help you choose."],
];

export default function HowDecantsWorkPage() {
  return (
    <RouteView>
      <PageHero eyebrow="How decants work" title="Try more, commit less." lead="A decant is simply a small, genuine portion of a perfume — poured from an authentic bottle into a smaller one." noteTitle="Not a sample spray." note="Decants are the same perfume, just measured into an amount you will actually use." orb="rgba(238,234,243,.8)" />
      <section className="section welcome-band" aria-labelledby="decantWhatTitle">
        <div className="container">
          <SectionHeading eyebrow="The basics" title="Same perfume, smaller bottle." id="decantWhatTitle"><p>Nothing is diluted or reformulated — only the amount changes.</p></SectionHeading>
          <div className="faq-grid">{BASICS.map(([h, p]) => <article className="faq-card" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div>
        </div>
      </section>
      <section className="section" aria-labelledby="decantCareTitle">
        <div className="container">
          <SectionHeading eyebrow="Getting the most from it" title="A little care goes far." id="decantCareTitle"><p>Simple habits that keep any perfume, decant or full bottle, at its best.</p></SectionHeading>
          <div className="process-grid">
            {CARE.map(([h, p], i) => <article className="process-card" key={h}><span className="process-number">{i + 1}</span><h3>{h}</h3><p>{p}</p></article>)}
          </div>
        </div>
      </section>
    </RouteView>
  );
}
