"use client";

import type { ReactNode } from "react";
import { UIProvider } from "@/components/providers/UIProvider";
import { PrefsProvider } from "@/components/providers/PrefsProvider";
import type { Lang, Theme } from "@/lib/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Intro } from "./Intro";
import { CartDrawer } from "./CartDrawer";
import { ProductModal } from "./ProductModal";
import { AuthModal } from "./AuthModal";
import { ChatWidget } from "./ChatWidget";
import { FloatingBag } from "./FloatingBag";
import { Toast } from "./Toast";

/** Everything that persists across routes: header, footer, drawers, modals, toast. */
export function SiteShell({ children, lang = "en", theme = "light" }: { children: ReactNode; lang?: Lang; theme?: Theme }) {
  return (
    <PrefsProvider lang={lang} theme={theme}>
    <UIProvider>
      <Intro />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <FloatingBag />
      <ChatWidget />
      <AuthModal />
      <Toast />
    </UIProvider>
    </PrefsProvider>
  );
}
