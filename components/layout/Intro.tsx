"use client";

import { useEffect, useState } from "react";

/** Brand splash, shown once per browser session (skipped for reduced-motion users). */
export function Intro() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("ild-intro-seen") === "1"; } catch { /* ignore */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) { setPhase("gone"); return; }
    const t1 = setTimeout(() => setPhase("leaving"), 3500);
    const t2 = setTimeout(() => {
      setPhase("gone");
      try { sessionStorage.setItem("ild-intro-seen", "1"); } catch { /* ignore */ }
    }, 4650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`intro-screen${phase === "leaving" ? " is-leaving" : ""}`} aria-hidden="true">
      <div className="intro-copy">
        <strong>I Love Decants</strong>
        <span>Pay less, have more!</span>
      </div>
    </div>
  );
}
