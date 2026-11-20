"use client";

import { useApi } from "@/lib/api/client";

/** Moving notice text under the navbar: every enabled notice scrolls in turn. Hidden when there are none. */
export function NoticeBar() {
  const { data } = useApi<{ items: string[] }>("/api/notice");
  const items = data?.items ?? [];
  if (!items.length) return null;
  // Four identical groups: the track moves by half its width, so the loop is seamless and wider than any screen.
  const chars = items.reduce((n, t) => n + t.length, 0);
  const dur = Math.max(18, Math.round(chars * 0.45));
  return (
    <div className="notice-bar" role="status" aria-label="Store notices" style={{ ["--notice-duration" as string]: `${dur}s` }}>
      <div className="notice-track">
        {[0, 1, 2, 3].map((g) => (
          <span key={g} className="notice-group" aria-hidden={g > 0 ? true : undefined}>
            {items.map((t, i) => <span key={i} className="notice-item">{t}</span>)}
          </span>
        ))}
      </div>
    </div>
  );
}
