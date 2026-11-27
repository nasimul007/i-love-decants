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
    // The script may set data-theme before React loads, hence suppressHydrationWarning (it covers this tag's attributes only).
    <html lang={lang} data-theme={theme} className={`${bnSerif.variable} ${bnSans.variable}`} suppressHydrationWarning>
      <head>
        {/* No saved choice: follow the device's light/dark setting, set before the first paint so there's no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var d=document.documentElement;if(!d.dataset.theme)d.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"})()` }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
