"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { ProductBottle } from "@/components/ui/BottleVisual";
import { useUI } from "@/components/providers/UIProvider";
import { useCatalog } from "@/hooks/useServices";
import { money } from "@/lib/format";
import { priceFrom } from "@/lib/volumes";
import { useSwipe } from "@/hooks/useSwipe";

/** Hero bottle swapper: auto-cycles, dot navigation, pointer-tilt parallax. */
export function HeroSwitcher() {
  const { products } = useCatalog();
  const { openProduct } = useUI();
  const stage = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(0);
  const [changing, setChanging] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tilt, setTilt] = useState<CSSProperties | null>(null);

  // The admin picks these (Home page & content → Home page perfumes); with none picked, show every perfume.
  const heroProducts = useMemo(() => {
    const preferred = products.filter((p) => p.featured);
    return preferred.length ? preferred : products;
  }, [products]);
  const go = (step: number) => setCurrent((c) => (c + step + heroProducts.length) % heroProducts.length);
  const swipe = useSwipe(go, heroProducts.length > 1);

  // Swap the artwork half-way through the fade (matches the 520 ms CSS transition).
  useEffect(() => {
    if (current === shown) return;
    setChanging(true);
    const t = setTimeout(() => { setShown(current); setChanging(false); }, 520);
    return () => clearTimeout(t);
  }, [current, shown]);

  useEffect(() => {
    if (heroProducts.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % heroProducts.length), 5100);
    return () => clearInterval(t);
  }, [heroProducts.length, current]); // restarting on `current` resets the timer after manual picks

  const safeShown = Math.min(shown, Math.max(heroProducts.length - 1, 0));
  const product = heroProducts[safeShown];

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || !stage.current) return;
    const b = stage.current.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    setTilt({
      ["--hero-rotate-y" as string]: `${x * 12}deg`, ["--hero-rotate-x" as string]: `${y * -8}deg`,
      ["--hero-shift-x" as string]: `${x * 10}px`, ["--hero-shift-y" as string]: `${y * 7}px`,
    });
  };
  const onLeave = () => { setTilt(null); setPressed(false); };

  return (
    <div
        ref={stage}
        className={`hero-stage${tilt ? " is-pointer-active" : ""}${pressed ? " is-pressed" : ""}`}
        style={{ ...(tilt ?? {}), ["--hero-pale" as string]: product?.pale } as CSSProperties}
        aria-live="polite"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerDown={(e) => { if ((e.target as Element).closest("[data-open-product]")) setPressed(true); }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        {...swipe}
      >
        {product ? (
          <>
            <div className={`hero-product${changing ? " is-changing" : ""}`}>
              <button className="hero-product-button" type="button" data-open-product data-cursor-grab aria-label={`View ${product.name} and choose a volume`} onClick={() => openProduct(product.id)}>
                <ProductBottle product={product} />
              </button>
            </div>
            <div className="hero-caption">
              <strong>{product.name}</strong>
              <span>{product.notes} · From {money(priceFrom(product))}</span>
              <small>Select the bottle to choose a volume</small>
            </div>
            {heroProducts.length > 1 && (
              <>
                <button className="icon-btn hero-arrow hero-arrow--prev" type="button" aria-label="Previous perfume" onClick={() => go(-1)}>‹</button>
                <button className="icon-btn hero-arrow hero-arrow--next" type="button" aria-label="Next perfume" onClick={() => go(1)}>›</button>
              </>
            )}
            <div className="hero-dots" aria-label="Hero perfumes">
              {heroProducts.map((p, i) => (
                <button key={p.id} className={`hero-dot${i === current ? " is-active" : ""}`} type="button" aria-label={`Show ${p.name}`} onClick={() => setCurrent(i)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="hero-product"><div className="hero-empty-state">Our scent shelf is being refreshed.</div></div>
            <div className="hero-caption"><strong>Returning shortly</strong><span>Check back for the next quiet favourite.</span></div>
          </>
        )}
    </div>
  );
}
