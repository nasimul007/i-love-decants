"use client";

import { useEffect, useRef, useState } from "react";
import { useApi } from "@/lib/api/client";

/** Scroll speed in px/s: slow enough to read comfortably, the same whatever the text length or screen width. */
const SPEED = 45;

/** Moving notice text under the navbar: every enabled notice scrolls in turn. Hidden when there are none. */
export function NoticeBar() {
  const { data } = useApi<{ items: string[] }>("/api/notice");
  const items = data?.items ?? [];
  const track = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(30);
  const [paused, setPaused] = useState(false);

  // The track moves by half its width per loop, so duration = that distance / speed. Re-measured on resize.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDur(Math.max(12, el.scrollWidth / 2 / SPEED));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null;
  // Four identical groups: the track moves by half its width, so the loop is seamless and wider than any screen.
  return (
    <div className={`notice-bar${paused ? " is-paused" : ""}`} role="status" aria-label="Store notices" title={paused ? "Tap to resume" : "Tap to pause"}
      style={{ ["--notice-duration" as string]: `${dur}s` }} onClick={() => setPaused((p) => !p)}>
      <div className="notice-track" ref={track}>
        {[0, 1, 2, 3].map((g) => (
          <span key={g} className="notice-group" aria-hidden={g > 0 ? true : undefined}>
            {items.map((t, i) => <span key={i} className="notice-item">{t}</span>)}
          </span>
        ))}
      </div>
    </div>
  );
}
