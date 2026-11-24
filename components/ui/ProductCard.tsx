"use client";

import type { CSSProperties } from "react";
import type { Product } from "@/types";
import { money } from "@/lib/format";
import { priceFrom, sizesLabel } from "@/lib/volumes";
import { useUI } from "@/components/providers/UIProvider";
import { ProductBottle } from "./BottleVisual";

export function ScentFamily({ product }: { product: Product }) {
  const values = product.scentFamilies?.length ? product.scentFamilies : [product.family];
  const families = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  if (!families.length) return null;
  return (
    <p className="product-family">
      <span className="product-family-label">Scent family:</span>
      {families.map((f, i) => (
        <span key={f} style={{ display: "contents" }}>
          {i > 0 && <span className="product-family-separator" aria-hidden="true">|</span>}
          <span>{f}</span>
        </span>
      ))}
    </p>
  );
}

/** The perfume parameters that are set, as [label, value]; empty ones are skipped, never guessed. */
export const factsOf = (p: Product): [string, string][] =>
  ([["Strength", p.strength], ["For", p.audience], ["Lasting", p.lasting && `${p.lasting} hrs`]] as [string, string | undefined][])
    .filter((f): f is [string, string] => !!f[1]);

export function ProductCard({ product }: { product: Product }) {
  const { openProduct } = useUI();
  return (
    <article className="product-card" style={{ "--card-pale": product.pale } as CSSProperties}>
      <button className="product-card-visual" type="button" onClick={() => openProduct(product.id)} data-cursor-grab aria-label={`View ${product.name}`}>
        <span className="product-badge">{product.badge}</span>
        <ProductBottle product={product} />
      </button>
      <div className="product-card-body">
        <button className="product-name-button" type="button" onClick={() => openProduct(product.id)}>
          {product.brand && <span className="product-brand">{product.brand}</span>}
          <h3 className="product-name">{product.name}</h3>
        </button>
        <ScentFamily product={product} />
        {factsOf(product).length > 0 && <p className="product-facts">{factsOf(product).map(([k, v]) => <span key={k}>{k === "Lasting" ? `Lasting ${v}` : v}</span>)}</p>}
        <p className="product-notes">{product.notes}</p>
        <div className="card-price-row">
          <span className="product-price"><span className="product-price-prefix">From </span>{money(priceFrom(product))}</span>
          <span className="size-range">{sizesLabel(product)}</span>
        </div>
        <div className="card-purchase-row">
          <button className="btn btn-primary btn-small" type="button" onClick={() => openProduct(product.id)} aria-label={`Choose a size of ${product.name}`}>Choose size</button>
        </div>
      </div>
    </article>
  );
}
