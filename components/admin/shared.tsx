"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export const inputStyle = { minHeight: 42, padding: ".6rem .8rem", border: "1px solid var(--line)", borderRadius: ".8rem", fontSize: ".9rem", width: "100%", outline: "none", background: "#fff" } as const;
export const emptyRow = (cols: number, text: string) => (
  <tr><td colSpan={cols} style={{ textAlign: "center", color: "var(--muted)", padding: "1.5rem" }}>{text}</td></tr>
);

export function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  // Phones show each table row as a card: every cell gets its column name (data-label), read by the CSS.
  useLayoutEffect(() => {
    body.current?.querySelectorAll("table.admin-table").forEach((t) => {
      const heads = [...t.querySelectorAll("thead th")].map((th) => th.textContent?.trim() ?? "");
      t.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => { if (!td.hasAttribute("colspan")) td.setAttribute("data-label", heads[i] ?? ""); }));
    });
  });
  return (
    <div className="admin-panel">
      <div className="admin-panel-hd"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>
      <div className="admin-panel-body" ref={body}>{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, wide }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.body.classList.toggle("drawer-open", open);
    return () => document.body.classList.remove("drawer-open");
  }, [open]);
  if (!open) return null;
  // Portal to <body>: the route wrapper has a CSS transform, which would otherwise become the containing block
  // for `position: fixed` and push the dialog far below the visible area.
  return createPortal(
    <div style={{ position: "fixed", zIndex: 5000, inset: 0, display: "grid", placeItems: "center", padding: "1rem", background: "rgba(53,46,48,.52)", backdropFilter: "blur(5px)", overflowY: "auto" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`mgr-modal${wide ? " mgr-modal--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>,
    document.body,
  );
}
