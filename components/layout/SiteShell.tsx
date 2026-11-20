"use client";

import type { ReactNode } from "react";
import { UIProvider } from "@/components/providers/UIProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Intro } from "./Intro";
import { CartDrawer } from "./CartDrawer";
import { ProductModal } from "./ProductModal";
import { AuthModal } from "./AuthModal";
import { ChatWidget } from "./ChatWidget";
import { Toast } from "./Toast";
import { Cursor } from "./Cursor";

/** Everything that persists across routes: header, footer, drawers, modals, toast. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <Intro />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <ChatWidget />
      <AuthModal />
      <Toast />
      <Cursor />
    </UIProvider>
  );
}
