import type { CSSProperties } from "react";
import type { BottleShape, Product } from "@/types";

interface Props {
  shape: BottleShape;
  liquid: string;
  ink: string;
  title: string;
  subtitle?: string;
  className?: string;
  id?: string;
  live?: boolean;
}

/** Pure-CSS bottle artwork. Colours/shape are driven by CSS custom properties + data-shape. */
export function BottleVisual({ shape, liquid, ink, title, subtitle = "I Love Decants", className = "", id, live }: Props) {
  const style = { "--liquid": liquid, "--bottle-ink": ink } as CSSProperties;
  return (
    <div id={id} className={`bottle-visual ${className}`.trim()} data-shape={shape} style={style} aria-hidden={live ? undefined : true}>
      <div className="bottle-cap" />
      <div className="bottle-neck" />
      <div className="bottle-body" />
      <div className="bottle-label" aria-live={live ? "polite" : undefined} aria-atomic={live ? true : undefined}>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

/** The product's main uploaded photo, or the drawn bottle when the admin hasn't added one. */
export function ProductBottle({ product }: { product: Product }) {
  const photo = product.images?.[0];
  // eslint-disable-next-line @next/next/no-img-element
  if (photo) return <img className="product-photo" src={`/api/images/${photo}`} alt={product.name} loading="lazy" decoding="async" />;
  return <BottleVisual shape={product.shape} liquid={product.liquid} ink={product.ink} title={product.name} />;
}
