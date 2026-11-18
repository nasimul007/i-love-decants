"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";
import { useUI } from "@/components/providers/UIProvider";
import { useCart, useCatalog, useCurrentCustomer } from "@/hooks/useServices";
import { initials, money } from "@/lib/format";
import { priceFrom } from "@/lib/volumes";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/custom", label: "Custom Design" },
  { href: "/contact", label: "Contact" },
];

export function Brand() {
  return (
    <>
      <span className="brand-main">I Love Decants</span>
      <span className="brand-tag">Pay less, have more!</span>
    </>
  );
}

function SearchBox() {
  const router = useRouter();
  const { products } = useCatalog();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const shell = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => [p.name, p.family, p.notes, p.description, p.top, p.heart, p.base].join(" ").toLowerCase().includes(q))
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
          className="search-input" type="search" placeholder="Search scents, notes, or gifts…" autoComplete="off"
          aria-label="Search scents, notes, or gifts" aria-controls="searchResults" aria-expanded={show}
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
      <div className={`search-results${show ? " is-open" : ""}`} id="searchResults" role="listbox" aria-label="Search suggestions">
        {show && !matches.length && <div className="search-empty">No exact match yet. Press Enter to view all results.</div>}
        {show && matches.map((p) => (
          <Link key={p.id} className="search-result" role="option" aria-selected={false} href={`/products?product=${p.id}`} onClick={() => { setOpen(false); setQuery(""); }}>
            <span className="search-swatch" style={{ ["--swatch" as string]: p.pale }} />
            <span><strong>{p.name}</strong><small>{p.family} · {p.notes}</small></span>
            <span className="search-result-price">from {money(priceFrom(p))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const customer = useCurrentCustomer();
  const { openCart, cartOpen, openAuth, openProfile } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="container header-row">
          <button className="icon-btn menu-button" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-controls="navLinks" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link className="brand" href="/" aria-label="I Love Decants home"><Brand /></Link>
          <nav className={`nav-links${menuOpen ? " is-open" : ""}`} id="navLinks" aria-label="Main navigation">
            {NAV.map((n) => (
              <Link key={n.href} className="nav-link" href={n.href} aria-current={pathname === n.href ? "page" : undefined}>{n.label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <SearchBox />
            <button
              className="profile-btn" type="button" title="Account"
              aria-label={customer ? `Your profile (${customer.name})` : "Sign in to your account"}
              onClick={() => (customer ? openProfile() : openAuth("login"))}
            >
              {customer ? <>{initials(customer.name)}<span className="profile-dot" title="Signed in" /></> : <UserIcon />}
            </button>
            <button className="icon-btn cart-button" type="button" aria-label="Open shopping bag" aria-controls="cartDrawer" aria-expanded={cartOpen} onClick={openCart}>
              <CartIcon /><span className="cart-count">{count}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
