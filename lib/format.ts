import { CONFIG } from "./config";

export function money(value: number): string {
  return CONFIG.currency + Number(value).toLocaleString("en-BD");
}

export function formatDate(ts?: string, locale = "en-BD"): string {
  return ts ? new Date(ts).toLocaleDateString(locale) : "—";
}

export function formatDateTime(ts: string, locale = "en-BD"): string {
  return new Date(ts).toLocaleString(locale);
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
