import Link from "next/link";
import { CONFIG } from "@/lib/config";
import { Brand } from "./Header";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand" href="/"><Brand /></Link>
          <p>Beautiful perfume in the volume that feels right for you, with clear prices and no oversized commitment.</p>
        </div>
        <div className="footer-column">
          <h3>Explore</h3>
          <div className="footer-links">
            <Link href="/products">All perfumes</Link>
            <Link href="/products?tab=oils">Perfume oils</Link>
            <Link href="/products?tab=gifts">Gift sets</Link>
            <Link href="/custom">Custom engraving</Link>
          </div>
        </div>
        <div className="footer-column">
          <h3>Help</h3>
          <div className="footer-links">
            <Link href="/contact">Contact us</Link>
            <Link href="/how-we-work">How we work</Link>
            <Link href="/delivery-returns">Delivery &amp; return policy</Link>
            <Link href="/how-decants-work">How decants work</Link>
          </div>
        </div>
        <div className="footer-column">
          <h3>Direct contact</h3>
          <div className="footer-links">
            <a href={`tel:${CONFIG.phoneHref}`}>Call or SMS: {CONFIG.phone}</a>
            <a href={CONFIG.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={CONFIG.telegram} target="_blank" rel="noreferrer">Telegram</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} I Love Decants. Frontend demonstration. · <Link className="footer-admin-link" href="/admin">Admin</Link></span>
        <div className="footer-socials" aria-label="Social media">
          <a href={CONFIG.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">fb</a>
          <a href={CONFIG.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">tt</a>
          <a href={CONFIG.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">ig</a>
        </div>
      </div>
    </footer>
  );
}
