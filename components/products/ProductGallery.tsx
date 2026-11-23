"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import type { Product } from "@/types";

/** Main photo + thumbnails for the product pop-up. Clicking the main photo opens the zoomable viewer. */
export function ProductGallery({ product }: { product: Product }) {
  const ids = product.images ?? [];
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const shots = ids.map((id, i) => ({ src: `/api/images/${id}`, alt: `${product.name} — photo ${i + 1} of ${ids.length}` }));
  const current = shots[Math.min(index, shots.length - 1)];
  if (!current) return null;

  return (
    <div className="gallery">
      <button type="button" className="gallery-main" aria-label={`Enlarge photo of ${product.name}`} onClick={() => setViewer(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} decoding="async" />
        <span className="gallery-zoom" aria-hidden="true">⤢ Zoom</span>
      </button>
      {shots.length > 1 && (
        <div className="gallery-thumbs" role="list">
          {shots.map((s, i) => (
            <button key={s.src} type="button" role="listitem" className={i === index ? "is-active" : ""} aria-label={`Show photo ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {viewer && <Lightbox images={shots} index={index} onIndex={setIndex} onClose={() => setViewer(false)} />}
    </div>
  );
}
