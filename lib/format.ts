import { CONFIG } from "./config";

export function money(value: number): string {
  return CONFIG.currency + Number(value).toLocaleString("en-BD");
}

export function formatDate(ts?: string): string {
  return ts ? new Date(ts).toLocaleDateString("en-BD") : "—";
}

export function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString("en-BD");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
