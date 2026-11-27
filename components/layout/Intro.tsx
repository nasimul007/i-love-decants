"use client";

import { useEffect, useState } from "react";

/** Brand splash, shown once per browser session (skipped for reduced-motion users). ~1.5 s in total, tap to skip:
 *  splash guidance keeps the exit animation under ~1 s and never pads with timers. */
export function Intro() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("ild-intro-seen") === "1"; } catch { /* ignore */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) { setPhase("gone"); return; }
    try { sessionStorage.setItem("ild-intro-seen", "1"); } catch { /* ignore */ }
    const t1 = setTimeout(() => setPhase("leaving"), 1100);
    const t2 = setTimeout(() => setPhase("gone"), 1550);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`intro-screen${phase === "leaving" ? " is-leaving" : ""}`} aria-hidden="true" onClick={() => setPhase("gone")}>
      <div className="intro-copy">
        <strong>I Love Decants</strong>
        <span>Pay less, have more!</span>
      </div>
    </div>
  );
}
