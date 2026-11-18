"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type AuthPanel = "login" | "register";

interface UIState {
  cartOpen: boolean;
  productId: number | null;
  authPanel: AuthPanel | null;
  profileOpen: boolean;
  chatOpen: boolean;
  toast: { text: string; visible: boolean };
  openCart: () => void;
  closeCart: () => void;
  openProduct: (id: number) => void;
  closeProduct: () => void;
  openAuth: (panel?: AuthPanel) => void;
  setAuthPanel: (panel: AuthPanel) => void;
  closeAuth: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  setChatOpen: (open: boolean) => void;
  showToast: (text: string) => void;
}

const UIContext = createContext<UIState | null>(null);

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [authPanel, setAuthPanelState] = useState<AuthPanel | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState({ text: "", visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    setToast({ text, visible: true });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2900);
  }, []);

  // Lock page scroll whenever an overlay is open.
  const locked = cartOpen || productId !== null || authPanel !== null || profileOpen;
  useEffect(() => {
    document.body.classList.toggle("drawer-open", locked);
    return () => document.body.classList.remove("drawer-open");
  }, [locked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setCartOpen(false);
      setProductId(null);
      setAuthPanelState(null);
      setProfileOpen(false);
      setChatOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<UIState>(
    () => ({
      cartOpen, productId, authPanel, profileOpen, chatOpen, toast,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      openProduct: (id) => setProductId(id),
      closeProduct: () => setProductId(null),
      openAuth: (panel = "login") => setAuthPanelState(panel),
      setAuthPanel: (panel) => setAuthPanelState(panel),
      closeAuth: () => setAuthPanelState(null),
      openProfile: () => setProfileOpen(true),
      closeProfile: () => setProfileOpen(false),
      setChatOpen,
      showToast,
    }),
    [cartOpen, productId, authPanel, profileOpen, chatOpen, toast, showToast],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
