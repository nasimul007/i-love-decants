"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { ProductBottle } from "@/components/ui/BottleVisual";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ScentFamily, factsOf } from "@/components/ui/ProductCard";
import { useUI } from "@/components/providers/UIProvider";
import { useCart, useCatalog, useSprays } from "@/hooks/useServices";
import { formatSprays } from "@/lib/services/catalogOverrides";
import { money } from "@/lib/format";
import { volumesOf } from "@/lib/volumes";
import type { Product } from "@/types";
import { RatingMini } from "@/components/reviews/RatingMini";
import { ProductReviews } from "@/components/reviews/ProductReviews";

export function ProductModal() {
  const { productId, closeProduct, openCart } = useUI();
  const { products } = useCatalog();
  const { service } = useCart();
  const sprays = useSprays();
  /** A volume in ml, or "full" for the Full bottle option. */
  const [size, setSize] = useState<number | "full">(0);
  const lastProduct = useRef<Product | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const found = productId !== null ? products.find((p) => p.id === productId) ?? null : null;
  if (found) lastProduct.current = found;
  const product = found ?? lastProduct.current;
  const open = !!found;
  // Only the volumes on sale that this perfume has a price for (+ Full bottle while ON); default to the smallest.
  const volumes = product ? volumesOf(product) : [];
  const full = product?.fullBottle;
  const firstChoice = (p: Product | null): number | "full" => (p ? volumesOf(p)[0] ?? (p.fullBottle ? "full" : 0) : 0);
  const selected: number | "full" = size === "full" ? (full ? "full" : firstChoice(product)) : volumes.includes(size) ? size : firstChoice(product);
  const selectedPrice = selected === "full" ? full?.price ?? 0 : product?.prices[selected] ?? 0;
  const selectedLabel = selected === "full" ? `Full bottle (${full?.ml} ml)` : `${selected} ml`;

  useEffect(() => {
    if (!open) return;
    setSize(firstChoice(found));
    const t = setTimeout(() => closeBtn.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, productId]);

  const add = () => {
    if (!found) return;
    const line = selected === "full" ? service.lineForFullBottle(found) : service.lineForProduct(found, selected);
    if (!line) return;
    service.add(line);
    // No toast: the bag opens right away and shows the item (the toast used to cover it).
    closeProduct();
    setTimeout(openCart, 140);
  };

  return (
    <div className={`modal-backdrop${open ? " is-open" : ""}`} role="presentation" onClick={(e) => { if (e.target === e.currentTarget) closeProduct(); }}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style={{ ["--modal-pale" as string]: product?.pale } as CSSProperties}>
        {product && (
          <>
            <button ref={closeBtn} className="icon-btn modal-close" type="button" aria-label="Close product details" onClick={closeProduct}><CloseIcon /></button>
            <div className={`modal-visual${product.images?.length ? " has-photos" : ""}`}>{product.images?.length ? <ProductGallery key={product.id} product={product} /> : <ProductBottle product={product} />}</div>
            <div className="modal-copy">
              {product.brand && <span className="product-brand">{product.brand}</span>}
              <h2 id="modalTitle">{product.name}</h2>
              <ScentFamily product={product} />
              <RatingMini id={product.id} onClick={() => document.getElementById("productReviews")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
              <div className="modal-size-block">
                <span className="size-label">Choose your volume <small aria-live="polite">{selectedLabel} selected</small></span>
                <div className="size-options" aria-label="Available volumes">
                  {volumes.map((s) => (
                    <button key={s} className={`size-option${s === selected ? " is-active" : ""}`} type="button" aria-pressed={s === selected} onClick={() => setSize(s)}>
                      <strong>{s} ml</strong><span>{product.wasPrices?.[s] !== undefined && <s className="was-price">{money(product.wasPrices[s])}</s>}{money(product.prices[s])}</span>{sprays[s] !== undefined && <small className="size-option-sprays">{formatSprays(sprays[s])}</small>}
                    </button>
                  ))}
                  {full && (
                    <button className={`size-option size-option--full${selected === "full" ? " is-active" : ""}`} type="button" aria-pressed={selected === "full"} onClick={() => setSize("full")}>
                      <strong>Full bottle</strong><span>{money(full.price)}</span><small className="size-option-sprays">{full.ml} ml · {formatSprays(full.sprays)}</small>
                    </button>
                  )}
                </div>
              </div>
              <div className="modal-purchase">
                <span className="modal-price">{selected !== "full" && product.wasPrices?.[selected] !== undefined && <s className="was-price">{money(product.wasPrices[selected])}</s>}{money(selectedPrice)}</span>
                <button className="btn btn-primary" type="button" aria-label={`Add ${product.name} to cart`} onClick={add}>Add to cart</button>
              </div>
              <p className="modal-trust">Cash on delivery · 1–2 day delivery inside Dhaka · Poured from original bottles</p>
              {product.description && <p className="modal-description">{product.description}</p>}
              {factsOf(product).length > 0 && (
                <dl className="notes-pyramid" aria-label="Perfume details">
                  {factsOf(product).map(([k, v]) => <div key={k} className="note-level"><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
              )}
              {product.lasting && <p className="modal-fineprint">Lasting is a general guide from wear tests; skin, weather and the number of sprays change it.</p>}
              {[product.top, product.heart, product.base].some(Boolean) && (
                <dl className="notes-pyramid" aria-label="Fragrance notes">
                  {([["Top", product.top], ["Heart", product.heart], ["Base", product.base]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k} className="note-level"><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
              )}
              {!!product.keyNotes?.length && <p className="key-notes" aria-label="Key notes">{product.keyNotes.map((n) => <span key={n}>{n}</span>)}</p>}
              <ProductReviews key={product.id} id={product.id} name={product.name} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
