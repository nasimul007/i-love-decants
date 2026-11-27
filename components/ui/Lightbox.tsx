"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSwipe } from "@/hooks/useSwipe";

interface Props {
  images: { src: string; alt: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const MIN = 1, MAX = 4, STEP = 0.75;

/** Full-screen photo viewer: click/double-tap or +/− to zoom, drag/scroll to look around, Esc / × / click outside to close. */
export function Lightbox({ images, index, onIndex, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const img = images[index];
  const many = images.length > 1;

  useEffect(() => { setZoom(1); scroller.current?.scrollTo(0, 0); }, [index]);
  useEffect(() => { closeBtn.current?.focus(); }, []);

  useEffect(() => {
    // Capture phase + stopImmediatePropagation: Esc closes only the viewer, not the product pop-up behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); }
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX, z + STEP));
      else if (e.key === "-") setZoom((z) => Math.max(MIN, z - STEP));
      else if (many && e.key === "ArrowRight") onIndex((index + 1) % images.length);
      else if (many && e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, images.length, many, onClose, onIndex]);

  // Flick to the next/previous photo; while zoomed in, a finger pans the photo instead.
  const swipe = useSwipe((step) => onIndex((index + step + images.length) % images.length), many && zoom <= 1);

  if (typeof document === "undefined" || !img) return null;
  const zoomed = zoom > 1;

  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lb-bar">
        <span className="lb-count" aria-live="polite">{many ? `${index + 1} / ${images.length}` : ""}</span>
        <div className="lb-tools">
          <button type="button" aria-label="Zoom out" disabled={zoom <= MIN} onClick={() => setZoom((z) => Math.max(MIN, z - STEP))}>−</button>
          <button type="button" aria-label="Zoom in" disabled={zoom >= MAX} onClick={() => setZoom((z) => Math.min(MAX, z + STEP))}>+</button>
          <button ref={closeBtn} type="button" aria-label="Close photo viewer" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="lb-scroll" ref={scroller} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} {...swipe}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={`lb-img${zoomed ? " is-zoomed" : ""}`} src={img.src} alt={img.alt} draggable={false}
          style={zoomed ? { width: `${zoom * 100}%` } : undefined}
          onClick={() => setZoom((z) => (z > 1 ? 1 : 2.5))} />
      </div>
      {many && (
        <>
          <button type="button" className="lb-nav lb-prev" aria-label="Previous photo" onClick={() => onIndex((index - 1 + images.length) % images.length)}>‹</button>
          <button type="button" className="lb-nav lb-next" aria-label="Next photo" onClick={() => onIndex((index + 1) % images.length)}>›</button>
        </>
      )}
      <p className="lb-hint">{zoomed ? "Click the photo to zoom out · scroll or drag to look around" : "Click the photo to zoom in"}</p>
    </div>,
    document.body,
  );
}
