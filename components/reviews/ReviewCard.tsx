import type { ComponentType, SVGProps } from "react";
import { CartIcon, ChatIcon, FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { ProductGallery } from "@/components/products/ProductGallery";
import type { Review } from "@/types";

/** Where a review came from: label, icon and the words on its "open the original" link. */
export const SOURCES: Record<Review["source"], { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; open: string }> = {
  website: { label: "Website", Icon: CartIcon, open: "" },
  whatsapp: { label: "WhatsApp", Icon: WhatsAppIcon, open: "See the chat" },
  facebook: { label: "Facebook", Icon: FacebookIcon, open: "See it on Facebook" },
  instagram: { label: "Instagram", Icon: InstagramIcon, open: "See it on Instagram" },
  other: { label: "Customer", Icon: ChatIcon, open: "See the original" },
};

/** "27 Nov 2026": day-month order as read in Bangladesh, in Dhaka time so server and browser agree. */
export const reviewDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

export const Stars = ({ n, size }: { n: number; size?: "lg" }) => (
  <span className={`stars${size ? ` stars-${size}` : ""}`} role="img" aria-label={`Rated ${n} out of 5`}>
    {"★★★★★".slice(0, Math.round(n))}<span className="stars-off">{"★★★★★".slice(Math.round(n))}</span>
  </span>
);

/** One review. With a link, the whole card opens the original post (e.g. the Facebook post) in a new tab. `compact`: inside the product pop-up. */
export function ReviewCard({ r, compact }: { r: Review; compact?: boolean }) {
  const src = SOURCES[r.source] ?? SOURCES.other;
  return (
    <article className={`review-card${r.link ? " has-link" : ""}${compact ? " is-compact" : ""}`}>
      <header className="review-head">
        <Stars n={r.rating} />
        <span className={`review-source is-${r.source}`}><src.Icon width={14} height={14} />{src.label}</span>
      </header>
      <blockquote className="review-text">{r.text}</blockquote>
      {!!r.images.length && <div className="review-photos"><ProductGallery product={{ name: `Review by ${r.name}`, images: r.images }} /></div>}
      <footer className="review-foot">
        <span className="review-avatar" aria-hidden="true">{r.name.trim().charAt(0).toUpperCase()}</span>
        <span>
          <strong>{r.name}{r.verified && <span className="review-verified" title="Bought from I Love Decants and received the order">✓ Verified buyer</span>}</strong>
          <small>{[compact ? "" : r.product, reviewDate(r.date)].filter(Boolean).join(" · ")}</small>
        </span>
      </footer>
      {r.reply && (
        <div className="review-reply">
          <strong>Reply from I Love Decants</strong>
          <p>{r.reply}</p>
        </div>
      )}
      {r.link && <a className="review-open" href={r.link} target="_blank" rel="noopener noreferrer">{src.open || "See the original"} <span aria-hidden="true">↗</span></a>}
    </article>
  );
}
