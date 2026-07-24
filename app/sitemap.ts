import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/** Stable release date for sitemap lastModified (1.2.0). */
const RELEASE_DATE = new Date("2026-07-24");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  return [
    {
      url: `${base}/`,
      lastModified: RELEASE_DATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/settings`,
      lastModified: RELEASE_DATE,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/llms.txt`,
      lastModified: RELEASE_DATE,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
