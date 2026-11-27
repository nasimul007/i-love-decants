import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE_URL } from "@/lib/config";
import { Hind_Siliguri, Tiro_Bangla } from "next/font/google";
import { getPrefs } from "@/lib/i18n/server";

// Bangla fonts (self-hosted by Next, Bengali letters only, so English keeps its fonts): Tiro Bangla for the serif
// headings (classical, matches the Latin serif), Hind Siliguri for body text (clear at small sizes).
const bnSerif = Tiro_Bangla({ weight: "400", subsets: ["bengali"], variable: "--font-bn-serif", display: "swap" });
const bnSans = Hind_Siliguri({ weight: ["400", "500", "600", "700"], subsets: ["bengali"], variable: "--font-bn-sans", display: "swap" });

const description = "Authentic perfume decants in Bangladesh: try designer and niche fragrances in small sizes, plus perfume oils and gift sets. Cash on delivery across Bangladesh.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "I Love Decants — Pay less, have more!",
  description,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: "I Love Decants", locale: "en_BD", title: "I Love Decants — Pay less, have more!", description },
};

export const viewport: Viewport = { themeColor: "#fbf8f3", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { lang, theme } = await getPrefs();
  return (
    <html lang={lang} data-theme={theme} className={`${bnSerif.variable} ${bnSans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
