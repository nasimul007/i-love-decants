"use client";

import { useState } from "react";
import { useApi } from "@/lib/api/client";
import type { PublicFaq } from "@/lib/api/admin";

/** Collapsible FAQ at the bottom of the homepage. Questions are managed in Admin → Home page & content. Hidden when empty. */
export function FaqSection() {
  const { data } = useApi<PublicFaq[]>("/api/faq");
  const [open, setOpen] = useState<number | null>(null);
  const faqs = Array.isArray(data) ? data : [];
  if (!faqs.length) return null;
  return (
    <section className="section faq-section" id="faq" aria-labelledby="faqTitle">
      <div className="container faq-wrap">
        <div className="faq-head">
          <span className="eyebrow">Good to know</span>
          <h2 id="faqTitle">Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((f) => {
            const isOpen = open === f.id;
            return (
              <div key={f.id} className={`faq-item${isOpen ? " is-open" : ""}`}>
                <h3>
                  <button type="button" className="faq-q" aria-expanded={isOpen} aria-controls={`faq-a-${f.id}`} id={`faq-q-${f.id}`} onClick={() => setOpen(isOpen ? null : f.id)}>
                    <span>{f.question}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="faq-a" id={`faq-a-${f.id}`} role="region" aria-labelledby={`faq-q-${f.id}`} hidden={!isOpen}>
                  <p>{f.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
