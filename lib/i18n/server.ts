import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, THEME_COOKIE, translator, type Lang, type Theme } from "./index";

/** The visitor's language and theme, from the cookies the header switches set (defaults: English, light). */
export async function getPrefs(): Promise<{ lang: Lang; theme: Theme }> {
  const c = await cookies();
  return { lang: c.get(LANG_COOKIE)?.value === "bn" ? "bn" : "en", theme: c.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light" };
}
/** Translator for server components (page titles, intros…). */
export async function getT() {
  return translator((await getPrefs()).lang);
}
