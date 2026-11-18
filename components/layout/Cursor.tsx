"use client";

import { useEffect, useRef } from "react";

const BADGES: Record<string, string> = {
  grab: "✋", grabbing: "✊", help: "?", "not-allowed": "✕",
  "resize-ns": "↕", "resize-ew": "↔", "resize-nesw": "⤢", "resize-nwse": "⤡",
};

/** Optional trailing pink cursor. Only runs on fine-pointer devices; touch keeps native behaviour. */
export function Cursor() {
  const layer = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const arrow = useRef<SVGSVGElement>(null);
  const badge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    root.classList.toggle("has-custom-cursor", fine);
    if (!fine) return;

    const point = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dotPos = { ...point };
    const ringPos = { ...point };
    let state = "default";
    let down = false;
    root.classList.add("cursor-default");

    const setState = (next: string) => {
      if (next === state) return;
      root.classList.remove(`cursor-${state}`);
      state = next;
      root.classList.add(`cursor-${state}`);
      if (badge.current) badge.current.textContent = BADGES[next] ?? "";
    };

    const detect = (t: EventTarget | null): string => {
      if (!(t instanceof Element)) return "default";
      if (t.closest("[disabled], [aria-disabled='true'], .is-disabled")) return "not-allowed";
      if (t.closest("a, button, .btn, [role='button'], input[type='submit'], input[type='checkbox'], input[type='radio'], select, .icon-btn")) return "pointer";
      if (t.closest("textarea")) return "resize-nwse";
      if (t.closest("input[type='text'], input[type='search'], input[type='email'], input[type='tel'], input[type='password'], input[type='number']")) return "text";
      if (t.closest("[data-cursor-grab]")) return down ? "grabbing" : "grab";
      return "default";
    };

    const setTouch = (on: boolean) => {
      root.classList.toggle("touch-mode", on);
      if (layer.current) layer.current.style.display = on ? "none" : "";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return setTouch(true);
      if (e.pointerType === "mouse") setTouch(false);
      point.x = e.clientX; point.y = e.clientY;
      setState(detect(e.target));
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return setTouch(true);
      down = true;
      root.classList.add("cursor-mousedown");
      if (state === "grab") setState("grabbing");
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      down = false;
      root.classList.remove("cursor-mousedown");
    };
    const onLeave = () => { if (layer.current) layer.current.style.opacity = "0"; };
    const onEnter = () => { if (layer.current) layer.current.style.opacity = "1"; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf = 0;
    const tick = () => {
      dotPos.x += (point.x - dotPos.x) * 0.62; dotPos.y += (point.y - dotPos.y) * 0.62;
      ringPos.x += (point.x - ringPos.x) * 0.18; ringPos.y += (point.y - ringPos.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      if (arrow.current) arrow.current.style.transform = `translate3d(${point.x - 3}px, ${point.y - 2}px, 0) rotate(-9deg)`;
      if (badge.current) badge.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      root.classList.remove("has-custom-cursor", "touch-mode", "cursor-mousedown", `cursor-${state}`, "cursor-default");
    };
  }, []);

  return (
    <div className="cursor-layer" ref={layer} aria-hidden="true">
      <div className="cursor-ring" ref={ring} />
      <div className="cursor-dot" ref={dot} />
      <svg className="cursor-arrow" ref={arrow} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 2.4 20.2 11a1 1 0 0 1-.16 1.85l-6.4 1.94-2.9 6.05a1 1 0 0 1-1.83-.07L4 2.4Z" />
      </svg>
      <div className="cursor-badge" ref={badge} />
    </div>
  );
}
