"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, SVGProps } from "react";
import { BottleIcon, CartIcon, ChatIcon, CloseIcon, HelpIcon, HomeIcon, MenuIcon, MoonIcon, PenIcon, SearchIcon, StarIcon, SunIcon, UserIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { CONFIG } from "@/lib/config";
import { usePrefs, useT } from "@/components/providers/PrefsProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useCart, useCatalog, useCurrentCustomer } from "@/hooks/useServices";
import { useApi } from "@/lib/api/client";
import { initials, money } from "@/lib/format";
import { priceFrom, searchText } from "@/lib/volumes";
import { NoticeBar } from "./NoticeBar";

/** Main navigation. On phones each item also shows its icon and a one-line note (hidden on desktop). */
const NAV = [
  { href: "/", label: "Home", note: "Start here", Icon: HomeIcon },
  { href: "/products", label: "Products", note: "Decants, oils & gift sets", Icon: BottleIcon },
  { href: "/custom", label: "Custom Design", note: "Engrave a bottle", Icon: PenIcon },
  { href: "/reviews", label: "Reviews", note: "What customers say", Icon: StarIcon },
  { href: "/contact", label: "Contact", note: "WhatsApp, Messenger, phone", Icon: ChatIcon },
];

function NavItem({ label, note, Icon }: { label: string; note: string; Icon: (p: SVGProps<SVGSVGElement>) => ReactNode }) {
  const t = useT();
  return <><span className="nav-ico" aria-hidden="true"><Icon width={20} height={20} /></span><span className="nav-text">{t(label)}<small className="nav-note">{t(note)}</small></span><span className="nav-chev" aria-hidden="true">›</span></>;
}

/** Language (English ⇄ বাংলা) and night-mode switches: small buttons in the desktop header, full-width in the phone menu. */
function PrefSwitches({ inMenu }: { inMenu?: boolean }) {
  const { lang, theme, setLang, setTheme, t } = usePrefs();
  const dark = theme === "dark";
  const cls = inMenu ? "nav-quick" : "icon-btn pref-btn";
  return (
    <>
      <button className={`${cls} lang-btn`} type="button" lang={lang === "bn" ? "en" : "bn"} onClick={() => setLang(lang === "bn" ? "en" : "bn")}
        aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন (Switch to Bangla)"}>{inMenu ? (lang === "bn" ? "English" : "বাংলা") : (lang === "bn" ? "EN" : "বাং")}</button>
      <button className={cls} type="button" aria-pressed={dark} onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? t("Switch to day mode") : t("Switch to night mode")} title={dark ? t("Day mode") : t("Night mode")}>
        {dark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}{inMenu && (dark ? t("Day mode") : t("Night mode"))}
      </button>
    </>
  );
}

export function Brand() {
  const t = useT();
  return (
    <>
      <span className="brand-main">I Love Decants</span>
      <span className="brand-tag">{t("Pay less, have more!")}</span>
    </>
  );
}

function SearchBox() {
  const router = useRouter();
  const { products } = useCatalog();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const t = useT();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => searchText(p).includes(q))
      .slice(0, 5);
  }, [products, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!shell.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const show = open && query.trim().length > 0;

  return (
    <div className="search-shell" ref={shell}>
      <div className="search-field">
        <SearchIcon />
        <input
          className="search-input" type="search" placeholder={t("Search scents, notes, or gifts…")} autoComplete="off"
          aria-label={t("Search scents, notes, or gifts")} aria-controls="searchResults" aria-expanded={show}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") {
              e.preventDefault();
              const q = query.trim();
              if (q) { setOpen(false); router.push(`/products?q=${encodeURIComponent(q)}`); }
            }
          }}
        />
      </div>
      <div className={`search-results${show ? " is-open" : ""}`} id="searchResults" role="listbox" aria-label={t("Search suggestions")}>
        {show && !matches.length && <div className="search-empty">{t("No exact match yet. Press Enter to view all results.")}</div>}
        {show && matches.map((p) => (
          <Link key={p.id} className="search-result" role="option" aria-selected={false} href={`/products?product=${p.id}`} onClick={() => { setOpen(false); setQuery(""); }}>
            <span className="search-swatch" style={{ ["--swatch" as string]: p.pale }} />
            <span><strong>{p.name}</strong><small>{t(p.family)} · {p.notes}</small></span>
            <span className="search-result-price">{t("From")} {money(priceFrom(p))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const faqs = useApi<unknown[]>("/api/faq").data;
  const hasFaq = Array.isArray(faqs) && faqs.length > 0;
  const { count } = useCart();
  const customer = useCurrentCustomer();
  const { openCart, cartOpen, openAuth } = useUI();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">{t("Skip to content")}</a>
      <header className="site-header">
        <div className="container header-row">
          <button className="icon-btn menu-button" type="button" aria-label={menuOpen ? t("Close menu") : t("Open menu")} aria-controls="navLinks" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link className="brand" href="/" aria-label={t("I Love Decants home")}><Brand /></Link>
          <nav className={`nav-links${menuOpen ? " is-open" : ""}`} id="navLinks" aria-label={t("Main navigation")}>
            {NAV.map((n, i) => (
              <Link key={n.href} className="nav-link" style={{ "--i": i } as CSSProperties} href={n.href} aria-current={pathname === n.href ? "page" : undefined}><NavItem {...n} /></Link>
            ))}
            {hasFaq && <Link className="nav-link" style={{ "--i": NAV.length } as CSSProperties} href="/faq" aria-current={pathname === "/faq" ? "page" : undefined}><NavItem label="FAQ" note="Quick answers" Icon={HelpIcon} /></Link>}
            <div className="nav-extra" style={{ "--i": NAV.length + 1 } as CSSProperties}>
              <a className="nav-quick is-wa" href={CONFIG.whatsapp} target="_blank" rel="noreferrer"><WhatsAppIcon width={18} height={18} />{t("WhatsApp us")}</a>
              <button className="nav-quick" type="button" onClick={() => { setMenuOpen(false); if (customer) router.push("/account"); else openAuth("login"); }}><UserIcon width={18} height={18} />{customer ? t("My account") : t("Sign in")}</button>
              <PrefSwitches inMenu />
            </div>
          </nav>
          <div className="header-actions">
            <SearchBox />
            <PrefSwitches />
            <button
              className="profile-btn" type="button" title={t("Account")}
              aria-label={customer ? t("Your profile ({name})", { name: customer.name }) : t("Sign in to your account")}
              onClick={() => (customer ? router.push("/account") : openAuth("login"))}
            >
              {customer ? <>{initials(customer.name)}<span className="profile-dot" title={t("Signed in")} /></> : <UserIcon />}
            </button>
            <button className="icon-btn cart-button" type="button" aria-label={t("Open shopping bag")} aria-controls="cartDrawer" aria-expanded={cartOpen} onClick={openCart}>
              <CartIcon /><span className="cart-count">{count}</span>
            </button>
          </div>
        </div>
        <NoticeBar />
      </header>
    </>
  );
}
