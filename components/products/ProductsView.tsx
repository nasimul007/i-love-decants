"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeading } from "@/components/ui/PageHero";
import { useUI } from "@/components/providers/UIProvider";
import { useCart, useCatalog, useFullBottle, useVolumes } from "@/hooks/useServices";
import { priceFrom } from "@/lib/volumes";
import { money } from "@/lib/format";

type Tab = "decants" | "oils" | "gifts";
type Sort = "featured" | "price-low" | "price-high" | "name";
interface Filters { family: string; size: string; price: string; sort: Sort }
const DEFAULTS: Filters = { family: "all", size: "all", price: "all", sort: "featured" };

function Chip({ name, value, label, current, onPick }: { name: string; value: string; label: string; current: string; onPick: (v: string) => void }) {
  return (
    <label className="filter-chip">
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick(value)} />
      <span>{label}</span>
    </label>
  );
}

export function ProductsView() {
  const params = useSearchParams();
  const router = useRouter();
  const { openProduct, showToast } = useUI();
  const { products, gifts, oils, categories } = useCatalog();
  const volumes = useVolumes();
  const fullBottle = useFullBottle();
  const { service } = useCart();

  const query = (params.get("q") ?? "").trim().toLowerCase();
  const tabParam = params.get("tab");
  const [tab, setTab] = useState<Tab>(tabParam === "oils" || tabParam === "gifts" ? tabParam : "decants");
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (tabParam === "oils" || tabParam === "gifts" || tabParam === "decants") {
      setTab(tabParam);
      document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tabParam]);

  // Deep-link: /products?product=3 opens that perfume's modal, then tidies the URL.
  const deep = Number(params.get("product"));
  useEffect(() => {
    if (!deep || !products.length) return; // wait for the catalogue: on a cold load the link used to fire before it arrived
    const t = setTimeout(() => {
      if (products.some((p) => p.id === deep)) openProduct(deep);
      router.replace(query ? `/products?q=${encodeURIComponent(query)}` : "/products", { scroll: false });
    }, 160);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep, products.length]);

  const items = useMemo(() => {
    const list = products.filter((p) => {
      const min = priceFrom(p);
      const family = filters.family === "all" || p.family.toLowerCase() === filters.family;
      const size = filters.size === "all" || (filters.size === "full" ? !!p.fullBottle : Object.prototype.hasOwnProperty.call(p.prices, filters.size));
      const price = filters.price === "all" || (filters.price === "under300" ? min < 300 : min >= 300);
      const hay = [p.name, p.family, p.notes, p.description].join(" ").toLowerCase();
      return family && size && price && (!query || hay.includes(query));
    });
    if (filters.sort === "price-low") list.sort((a, b) => priceFrom(a) - priceFrom(b));
    if (filters.sort === "price-high") list.sort((a, b) => priceFrom(b) - priceFrom(a));
    if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, filters, query]);

  const set = (key: keyof Filters) => (value: string) => setFilters((f) => ({ ...f, [key]: value }));

  // A category hidden by the admin can't stay selected as a filter.
  useEffect(() => {
    if (categories.length && filters.family !== "all" && !categories.some((c) => c.toLowerCase() === filters.family)) setFilters((f) => ({ ...f, family: "all" }));
  }, [categories, filters.family]);

  // A volume removed by the admin can't stay selected as a filter.
  useEffect(() => {
    const gone = filters.size === "full" ? !fullBottle : filters.size !== "all" && !volumes.includes(Number(filters.size));
    if (gone) setFilters((f) => ({ ...f, size: "all" }));
  }, [volumes, fullBottle, filters.size]);

  const addGift = (id: string, name: string) => {
    const gift = gifts.find((g) => g.id === id);
    if (gift) { service.add(service.lineForGift(gift)); showToast(`${name} added to your bag.`); }
  };
  const addOil = (id: string, name: string) => {
    const oil = oils.find((o) => o.id === id);
    if (oil) { service.add(service.lineForOil(oil)); showToast(`${name} added to your bag.`); }
  };

  // The tab lives in the URL, so a footer link such as /products?tab=decants always switches to (and scrolls to) its section.
  const pickTab = (id: Tab) => {
    setTab(id);
    const next = new URLSearchParams(params.toString());
    next.set("tab", id);
    router.replace(`/products?${next.toString()}`, { scroll: false });
  };

  const tabs: [Tab, string][] = [["decants", "Perfume Decants"], ["oils", "Perfume Oils"], ["gifts", "Gift Sets"]];

  return (
    <div className="container">
      <div className="product-section-tabs" id="product-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} className={`prod-tab-btn${tab === id ? " is-active" : ""}`} type="button" role="tab" aria-selected={tab === id} onClick={() => pickTab(id)}>{label}</button>
        ))}
      </div>

      {/* ───── Decants ───── */}
      <div className={`prod-section-panel${tab === "decants" ? " is-active" : ""}`}>
        <div className="catalog-layout">
          <aside className={`filters${filtersOpen ? " is-open" : ""}`} id="filtersPanel" aria-label="Product filters">
            <div className="filter-top">
              <h2>Filter softly</h2>
              <button className="filter-reset" type="button" onClick={() => setFilters((f) => ({ ...DEFAULTS, sort: f.sort }))}>Clear all</button>
              <button className="icon-btn mobile-filter-button" type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>×</button>
            </div>
            <div className="filter-group">
              <span className="filter-group-title">Scent family</span>
              <div className="filter-options">
                <Chip name="family" value="all" label="All" current={filters.family} onPick={set("family")} />
                {categories.map((f) => <Chip key={f} name="family" value={f.toLowerCase()} label={f} current={filters.family} onPick={set("family")} />)}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-group-title">Starting price</span>
              <div className="filter-options">
                <Chip name="price" value="all" label="Any" current={filters.price} onPick={set("price")} />
                <Chip name="price" value="under300" label="Under ৳300" current={filters.price} onPick={set("price")} />
                <Chip name="price" value="300plus" label="৳300+" current={filters.price} onPick={set("price")} />
              </div>
            </div>
          </aside>

          <div className="catalog-main">
            <div className="catalog-toolbar">
              <div>
                <button className="btn btn-secondary btn-small mobile-filter-button" type="button" aria-controls="filtersPanel" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}>Filters</button>
                <span className="catalog-count">
                  {items.length} scent{items.length === 1 ? "" : "s"}{query ? ` matching “${query}”` : ""}
                </span>
              </div>
              <label>
                <span className="sr-only">Sort products</span>
                <select className="soft-select" value={filters.sort} onChange={(e) => set("sort")(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name</option>
                </select>
              </label>
            </div>
            <div className="product-grid">
              {items.length
                ? items.map((p) => <ProductCard key={p.id} product={p} />)
                : <div className="empty-catalog"><h3>No quiet match yet</h3><p>Try another family or clear the filters.</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Oils ───── */}
      <div className={`prod-section-panel${tab === "oils" ? " is-active" : ""}`}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="eyebrow">Roll-on and ready</span>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 600, letterSpacing: "-.04em", margin: ".35rem 0 .6rem" }}>Perfume Oils.</h2>
          <p style={{ color: "var(--muted)", maxWidth: "48ch" }}>Alcohol-free, pocket-ready roll-ons — smooth to apply, easy to layer, made for a close and lasting scent ritual.</p>
        </div>
        <div className="oil-grid">
          {oils.map((oil) => (
            <article className="faq-card oil-card" key={oil.id}>
              <h3>{oil.brand}</h3>
              <p>Alcohol-free 6 ml roll-on, easy to carry and reapply through the day.</p>
              <div className="oil-card-footer">
                <span className="gift-price">{money(oil.price)}</span>
                <button className="btn btn-primary btn-small" type="button" onClick={() => addOil(oil.id, oil.name)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ───── Gifts ───── */}
      <div className={`prod-section-panel${tab === "gifts" ? " is-active" : ""}`}>
        <div className="gift-feature" style={{ marginBottom: "3rem" }}>
          <div className="gift-feature-copy">
            <span className="eyebrow">A calm place to begin</span>
            <h2>Let them discover slowly.</h2>
            <p>Our discovery gifts turn choosing perfume into a gentle experience. Several small volumes, a simple scent guide, and room to find the one that feels right.</p>
          </div>
          <div className="gift-feature-art" aria-hidden="true">
            <div className="mini-bottles">
              {([["tall", "#d5aab6", "#704352", "Bloom"], ["arch", "#a6b9a6", "#405744", "Sage"], ["round", "#b0a4c1", "#5f5471", "Hush"]] as const).map(([shape, liquid, ink, name]) => (
                <div key={name} className="bottle-visual" data-shape={shape} style={{ "--liquid": liquid, "--bottle-ink": ink } as CSSProperties}>
                  <div className="bottle-cap" /><div className="bottle-neck" /><div className="bottle-body" />
                  <div className="bottle-label"><strong>{name}</strong><small>15 ml</small></div>
                </div>
              ))}
            </div>
            <div className="gift-box-art" />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <SectionHeading eyebrow="Curated and ready" title="Gifts with an easy yes.">
            <p>Each set includes calm presentation packaging and space for a short personal message.</p>
          </SectionHeading>
        </div>
        <div className="gift-grid">
          {gifts.map((g) => (
            <article className="gift-card" key={g.id}>
              <div className="gift-card-art" style={{ "--gift-bg": `linear-gradient(145deg,${g.accent},#f8f1eb)` } as CSSProperties}>
                <div className="gift-box-art" />
              </div>
              <span className="eyebrow">Ready to give</span>
              <h3>{g.name}</h3>
              <p>{g.description}</p>
              <div className="gift-card-footer">
                <span className="gift-price">{money(g.price)}</span>
                <button className="btn btn-primary btn-small" type="button" onClick={() => addGift(g.id, g.name)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: "3rem" }}>
          <div style={{ marginBottom: "1.5rem" }}><SectionHeading eyebrow="Small finishing touches" title="Make it feel considered." /></div>
          <div className="gift-options-grid">
            <article className="gift-option"><span className="gift-option-icon" aria-hidden="true">⌁</span><h3>Soft gift wrapping</h3><p>Muted paper, a fabric ribbon, and a clean carton without excessive decoration.</p></article>
            <article className="gift-option"><span className="gift-option-icon" aria-hidden="true">Aa</span><h3>Personal message</h3><p>Add a short handwritten note at no extra charge to make the gift unmistakably yours.</p></article>
            <article className="gift-option"><span className="gift-option-icon" aria-hidden="true">◇</span><h3>Special packaging</h3><p>Choose a linen-touch box or a compact protective carton based on your budget.</p></article>
          </div>
        </div>
      </div>
    </div>
  );
}
