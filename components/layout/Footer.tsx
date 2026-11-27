"use client";

import { useT } from "@/components/providers/PrefsProvider";
import Link from "next/link";
import { CONFIG } from "@/lib/config";
import { Brand } from "./Header";
import { FacebookIcon, InstagramIcon } from "@/components/ui/Icons";

export function Footer() {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand" href="/"><Brand /></Link>
          <p>{t("Beautiful perfume in the volume that feels right for you, with clear prices and no oversized commitment.")}</p>
        </div>
        <div className="footer-column">
          <h3>{t("Explore")}</h3>
          <div className="footer-links">
            <Link href="/products?tab=decants">{t("Perfume decants")}</Link>
            <Link href="/products?tab=oils">{t("Perfume oils")}</Link>
            <Link href="/products?tab=gifts">{t("Gift sets")}</Link>
            <Link href="/custom">{t("Custom engraving")}</Link>
          </div>
        </div>
        <div className="footer-column">
          <h3>{t("Help")}</h3>
          <div className="footer-links">
            <Link href="/faq">{t("FAQ")}</Link>
            <Link href="/reviews">{t("Customer reviews")}</Link>
            <Link href="/contact">{t("Contact us")}</Link>
            <Link href="/how-we-work">{t("How we work")}</Link>
            <Link href="/delivery-returns">{t("Delivery & return policy")}</Link>
            <Link href="/how-decants-work">{t("How decants work")}</Link>
          </div>
        </div>
        <div className="footer-column">
          <h3>{t("Direct contact")}</h3>
          <div className="footer-links">
            <a href={`tel:${CONFIG.phoneHref}`}>{t("Call or SMS:")} {CONFIG.phone}</a>
            <a href={CONFIG.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} I Love Decants. · <Link className="footer-admin-link" href="/admin" lang="en">Admin</Link></span>
        <div className="footer-socials" aria-label={t("Social media")}>
          <a href={CONFIG.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon width={17} height={17} /></a>
          {CONFIG.instagram && <a href={CONFIG.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon width={17} height={17} /></a>}
        </div>
      </div>
    </footer>
  );
}
