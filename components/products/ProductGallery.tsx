"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";

/** Main photo + thumbnails (product pop-up, oil and gift cards). Clicking the main photo opens the zoomable viewer. */
export function ProductGallery({ product }: { product: { name: string; images?: number[] } }) {
  const ids = product.images ?? [];
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const shots = ids.map((id, i) => ({ src: `/api/images/${id}`, alt: `${product.name}, photo ${i + 1} of ${ids.length}` }));
  const current = shots[Math.min(index, shots.length - 1)];
  if (!current) return null;
  const go = (step: number) => setIndex((i) => (i + step + shots.length) % shots.length);

  return (
    <div className="gallery">
      <div className="gallery-stage">
        <button type="button" className="gallery-main" aria-label={`Enlarge photo of ${product.name}`} onClick={() => setViewer(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.src} alt={current.alt} decoding="async" />
          <span className="gallery-zoom" aria-hidden="true">⤢ Zoom</span>
        </button>
        {shots.length > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-arrow--prev" aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
            <button type="button" className="gallery-arrow gallery-arrow--next" aria-label="Next photo" onClick={() => go(1)}>›</button>
          </>
        )}
      </div>
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
