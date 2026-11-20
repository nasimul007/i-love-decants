"use client";

import { useApi } from "@/lib/api/client";

/** Moving notice text under the navbar. Hidden unless an admin has turned it on. */
export function NoticeBar() {
  const { data } = useApi<{ enabled: boolean; text: string }>("/api/notice");
  if (!data?.enabled || !data.text) return null;
  // Four copies in two identical halves → seamless loop that is always wider than the screen. Longer text scrolls slower per character.
  const dur = Math.max(18, Math.round(data.text.length * 0.45));
  return (
    <div className="notice-bar" role="status" aria-label="Store notice" style={{ ["--notice-duration" as string]: `${dur}s` }}>
      <div className="notice-track">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="notice-item" aria-hidden={i > 0 ? true : undefined}>{data.text}</span>
        ))}
      </div>
    </div>
  );
}
