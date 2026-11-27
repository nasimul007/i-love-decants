import { BN } from "./bn";

export type Lang = "en" | "bn";
export type Theme = "light" | "dark";
export const LANG_COOKIE = "ild-lang";
export const THEME_COOKIE = "ild-theme";
export type T = (text: string, vars?: Record<string, string | number>) => string;

/** English text is the key; Bangla comes from lib/i18n/bn.ts (missing → English). "{n}"-style slots are filled from `vars`. */
export const translator = (lang: Lang): T => (text, vars) => {
  let out = lang === "bn" ? BN[text] ?? text : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
};

/** Dates: Bangla month names with western digits (prices and phone numbers on the site use western digits too). */
export const dateLocale = (lang: Lang) => (lang === "bn" ? "bn-BD-u-nu-latn" : "en-BD");
