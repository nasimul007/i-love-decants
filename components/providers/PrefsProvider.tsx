"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, THEME_COOKIE, translator, type Lang, type T, type Theme } from "@/lib/i18n";

interface Prefs { lang: Lang; theme: Theme; t: T; setLang: (l: Lang) => void; setTheme: (t: Theme) => void }
const PrefsContext = createContext<Prefs>({ lang: "en", theme: "light", t: translator("en"), setLang: () => {}, setTheme: () => {} });

/** Language (English / Bangla) and theme (light / night) for the shop. Saved in cookies so the server renders them too. */
export function PrefsProvider({ lang: initialLang, theme: initialTheme, children }: { lang: Lang; theme: Theme; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);
  // Without a saved choice the server can't know the device theme; the root layout's script already set it on <html>.
  useEffect(() => { const d = document.documentElement.dataset.theme; if (d === "dark" || d === "light") setThemeState(d); }, []);
  const value = useMemo<Prefs>(() => ({
    lang, theme, t: translator(lang),
    setLang: (l) => {
      document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = l;
      setLangState(l);
      router.refresh(); // server-rendered text (page titles, intros) follows
    },
    setTheme: (th) => {
      document.cookie = `${THEME_COOKIE}=${th}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.dataset.theme = th;
      setThemeState(th);
    },
  }), [lang, theme, router]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
/** `const t = useT(); t("Add to cart")` */
export const useT = () => useContext(PrefsContext).t;
