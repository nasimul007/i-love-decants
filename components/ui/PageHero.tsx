import type { CSSProperties, ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  noteTitle: string;
  note: string;
  orb: string;
}

export function PageHero({ eyebrow, title, lead, noteTitle, note, orb }: Props) {
  return (
    <section className="page-hero" style={{ "--page-orb": orb } as CSSProperties}>
      <div className="container page-hero-inner">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        <aside className="hero-note-card">
          <strong>{noteTitle}</strong>
          <span>{note}</span>
        </aside>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Wraps a page body in the same `.route-view` the CSS animates in. */
export function RouteView({ children, id }: { children: ReactNode; id?: string }) {
  return <div className="route-view route-active" id={id}>{children}</div>;
}
