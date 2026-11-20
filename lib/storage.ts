"use client";

/**
 * Storage adapter — the ONLY file that touches `localStorage`.
 *
 * Services call `readJSON` / `writeJSON`; React components subscribe through
 * `useStored`. To move to a real backend, replace the service functions (see
 * HANDOFF.md) — components never talk to storage directly.
 */
import { useMemo, useSyncExternalStore } from "react";

export const KEYS = {
  cart: "ild-cart-v1",
  lastOrder: "ild-last-order",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function store(key: string): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readRaw(key: string): string | null {
  try {
    return store(key)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  return parseJSON(readRaw(key), fallback);
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    store(key)?.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — state simply won't persist */
  }
  emit();
}

export function removeKey(key: string): void {
  try {
    store(key)?.removeItem(key);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reactive read of a stored JSON value. The snapshot is the raw string (stable
 * between renders) so React never loops; parsing is memoised. On the server and
 * during hydration it returns `fallback`, so markup always matches.
 */
export function useStored<T>(key: string, fallback: T): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => parseJSON(raw, fallback), [raw]);
}
