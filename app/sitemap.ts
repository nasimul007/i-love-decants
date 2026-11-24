import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

const PAGES = ["", "/products", "/custom", "/how-decants-work", "/how-we-work", "/delivery-returns", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p ? 0.7 : 1 }));
}
