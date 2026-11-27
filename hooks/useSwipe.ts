"use client";

import { useRef } from "react";
import type { TouchEvent } from "react";

/**
 * Sideways finger flick on photos / slideshows: ≥ 40 px and mostly horizontal calls onSwipe(1) for next (flick left)
 * or onSwipe(-1) for previous. Up-down moves still scroll the page. Pair with CSS `touch-action: pan-y pinch-zoom`
 * so the browser doesn't also treat the flick as "go back". Two-finger gestures (pinch) are ignored.
 */
export function useSwipe(onSwipe: (step: 1 | -1) => void, enabled = true) {
  const start = useRef<{ x: number; y: number } | null>(null);
  if (!enabled) return {};
  return {
    onTouchStart: (e: TouchEvent) => { start.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current; start.current = null;
      const t = e.changedTouches[0];
      if (!s || !t) return;
      const dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
    },
  };
}
