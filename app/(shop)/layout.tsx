import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

/** Storefront: header, notice bar, footer, cart, chat. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
