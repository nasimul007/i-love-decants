import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

const description = "Authentic perfume decants in Bangladesh: try designer and niche fragrances in small sizes, plus perfume oils and gift sets. Cash on delivery across Bangladesh.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "I Love Decants — Pay less, have more!",
  description,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: "I Love Decants", locale: "en_BD", title: "I Love Decants — Pay less, have more!", description },
};

export const viewport: Viewport = { themeColor: "#fbf8f3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
