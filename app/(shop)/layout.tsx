import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getPrefs } from "@/lib/i18n/server";

/** Storefront: header, notice bar, footer, cart, chat; in the visitor's language and theme. */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const prefs = await getPrefs();
  return <SiteShell {...prefs}>{children}</SiteShell>;
}
