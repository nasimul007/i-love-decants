"use client";

/**
 * Tiny fetch + cache layer (no extra dependency). `useApi(url)` reads a GET endpoint and re-renders when
 * `mutate` / `refresh` update it; `call` performs writes and never throws.
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ServiceResult } from "@/types";

type Entry = { data: unknown; loaded: boolean };
const EMPTY: Entry = { data: undefined, loaded: false };
const cache = new Map<string, Entry>();
const inflight = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function mutate<T>(url: string, data: T): void {
  cache.set(url, { data, loaded: true });
  emit();
}

export async function refresh(url: string): Promise<void> {
  if (inflight.has(url)) return;
  inflight.add(url);
  try {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    if (res.ok) mutate(url, await res.json());
  } catch {
    /* offline: keep whatever is cached */
  } finally {
    inflight.delete(url);
  }
}

/** Re-fetches every cached entry whose url starts with `prefix` (e.g. all cached pages of a list). */
export const refreshPrefix = (prefix: string) => Promise.all([...cache.keys()].filter((k) => k.startsWith(prefix)).map(refresh));

/** Drops cached entries whose url starts with one of `prefixes` (e.g. on sign-out) so the next user can't see them. */
export function clearCache(...prefixes: string[]): void {
  for (const k of [...cache.keys()]) if (prefixes.some((p) => k.startsWith(p))) cache.delete(k);
  emit();
}

export function useApi<T>(url: string): { data: T | undefined; loaded: boolean } {
  const entry = useSyncExternalStore(subscribe, () => cache.get(url) ?? EMPTY, () => EMPTY);
  useEffect(() => { if (!cache.has(url)) void refresh(url); }, [url]);
  return useMemo(() => ({ data: entry.data as T | undefined, loaded: entry.loaded }), [entry]);
}

/** JSON write. Resolves to `{ ok, data }` or `{ ok: false, error }`. */
export async function call<T = undefined>(method: "POST" | "PATCH" | "DELETE", url: string, payload?: unknown): Promise<ServiceResult<T>> {
  try {
    const res = await fetch(url, {
      method, credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (json as { error?: string }).error ?? "Something went wrong." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
