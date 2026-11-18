"use client";

import { useUI } from "@/components/providers/UIProvider";

export function Toast() {
  const { toast } = useUI();
  return (
    <div className={`toast${toast.visible ? " is-visible" : ""}`} role="status" aria-live="polite">
      <span className="toast-check">✓</span>
      <span>{toast.text}</span>
    </div>
  );
}
