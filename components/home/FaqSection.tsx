"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/api/client";
import type { PublicFaq } from "@/lib/api/admin";

/** Collapsible FAQ: at the bottom of the homepage, and on its own /faq page (which passes the questions in from the
 *  server so search engines read every answer). Questions are managed in Admin → Home page & content. Hidden when empty. */
export function FaqSection({ initial, onPage }: { initial?: PublicFaq[]; onPage?: boolean }) {
  const { data } = useApi<PublicFaq[]>("/api/faq");
  const [open, setOpen] = useState<number | null>(onPage && initial?.length ? initial[0].id : null);
  const faqs = Array.isArray(data) ? data : initial ?? [];
  if (!faqs.length) return null;
  return (
    <section className="section faq-section" id={onPage ? undefined : "faq"} aria-labelledby="faqTitle">
      <div className="container faq-wrap">
        <div className="faq-head">
          <span className="eyebrow">{onPage ? `${faqs.length} answer${faqs.length === 1 ? "" : "s"}` : "Good to know"}</span>
          <h2 id="faqTitle">{onPage ? "Questions, answered." : "Frequently asked questions"}</h2>
          {!onPage && <Link className="btn btn-secondary btn-small faq-all" href="/faq">Open the FAQ page <span aria-hidden="true">→</span></Link>}
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
