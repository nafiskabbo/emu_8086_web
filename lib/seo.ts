import type { Metadata } from "next";
import { APP_AUTHOR, APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/version";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://emu8086web.vercel.app";

export const siteConfig = {
  name: APP_NAME,
  version: APP_VERSION,
  description: APP_TAGLINE,
  url: siteUrl,
  author: APP_AUTHOR,
  keywords: [
    "8086",
    "emulator",
    "assembler",
    "MASM",
    "assembly language",
    "microprocessor",
    "emu8086",
    "online assembler",
    "step debugger",
    "computer architecture",
    "DOS INT 21h",
  ],
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — 8086 Assembler & Emulator`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  authors: [{ name: APP_AUTHOR.name, url: APP_AUTHOR.url }],
  creator: APP_AUTHOR.name,
  publisher: APP_AUTHOR.name,
  keywords: siteConfig.keywords,
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — 8086 Assembler & Emulator`,
    description: APP_TAGLINE,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — 8086 Assembler & Emulator`,
    description: APP_TAGLINE,
    images: ["/og.svg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg" }],
    shortcut: ["/favicon.svg"],
  },
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
};
