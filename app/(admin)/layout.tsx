import type { ReactNode } from "react";
import { UIProvider } from "@/components/providers/UIProvider";
import { Toast } from "@/components/layout/Toast";

/** Back office: no storefront navbar, notice bar, footer, cart or chat. Only the dashboard's own top bar. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <main id="main-content">{children}</main>
      <Toast />
    </UIProvider>
  );
}
