"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { ProductBottle } from "@/components/ui/BottleVisual";
import { ScentFamily } from "@/components/ui/ProductCard";
import { useUI } from "@/components/providers/UIProvider";
import { useCart, useCatalog, useSprays } from "@/hooks/useServices";
import { formatSprays } from "@/lib/services/catalogOverrides";
import { money } from "@/lib/format";
import { volumesOf } from "@/lib/volumes";
import type { Product } from "@/types";

export function ProductModal() {
  const { productId, closeProduct, openCart, showToast } = useUI();
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
    const line = selected === "full" ? service.lineForFullBottle(found.id) : service.lineForProduct(found.id, selected);
    if (!line) return;
    service.add(line);
    showToast(`${found.name}, ${selectedLabel} added to your bag.`);
    closeProduct();
    setTimeout(openCart, 140);
  };

  return (
    <div className={`modal-backdrop${open ? " is-open" : ""}`} role="presentation" onClick={(e) => { if (e.target === e.currentTarget) closeProduct(); }}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style={{ ["--modal-pale" as string]: product?.pale } as CSSProperties}>
        {product && (
          <>
            <button ref={closeBtn} className="icon-btn modal-close" type="button" aria-label="Close product details" onClick={closeProduct}><CloseIcon /></button>
            <div className="modal-visual"><ProductBottle product={product} /></div>
            <div className="modal-copy">
              <ScentFamily product={product} />
              <h2 id="modalTitle">{product.name}</h2>
              <div className="modal-size-block">
                <span className="size-label">Choose your volume <small aria-live="polite">{selectedLabel} selected</small></span>
                <div className="size-options" aria-label="Available volumes">
                  {volumes.map((s) => (
                    <button key={s} className={`size-option${s === selected ? " is-active" : ""}`} type="button" aria-pressed={s === selected} onClick={() => setSize(s)}>
                      <strong>{s} ml</strong><span>{money(product.prices[s])}</span>{sprays[s] !== undefined && <small className="size-option-sprays">{formatSprays(sprays[s])}</small>}
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
                <span className="modal-price">{money(selectedPrice)}</span>
                <button className="btn btn-primary" type="button" onClick={add}>Add {product.name} to cart</button>
              </div>
              <p className="modal-description">{product.description}</p>
              <div className="notes-pyramid" aria-label="Fragrance notes">
                <div className="note-level"><strong>Top</strong><span>{product.top}</span></div>
                <div className="note-level"><strong>Heart</strong><span>{product.heart}</span></div>
                <div className="note-level"><strong>Base</strong><span>{product.base}</span></div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
