import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, THEME_COOKIE, translator, type Lang, type Theme } from "./index";

/** The visitor's language and theme, from the cookies the header switches set. Language defaults to English;
 *  no theme cookie = undefined, and the root layout's script follows the device's light/dark setting. */
export async function getPrefs(): Promise<{ lang: Lang; theme?: Theme }> {
  const c = await cookies();
  const th = c.get(THEME_COOKIE)?.value;
  return { lang: c.get(LANG_COOKIE)?.value === "bn" ? "bn" : "en", theme: th === "dark" || th === "light" ? th : undefined };
}
/** Translator for server components (page titles, intros…). */
export async function getT() {
  return translator((await getPrefs()).lang);
}
