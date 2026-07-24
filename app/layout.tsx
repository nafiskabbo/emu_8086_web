import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { buildJsonLd, rootMetadata } from "@/lib/seo";
import { IBM_Plex_Mono, IBM_Plex_Sans, VT323 } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  ...rootMetadata,
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = buildJsonLd();

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${vt323.variable} h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM context"
        />
        <link
          rel="alternate"
          type="text/markdown"
          href="/"
          title="Markdown for Agents"
        />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <meta
          name="google-site-verification"
          content="4b8J6NrWHLMITLuVCfJLqqXJRMLzERtxpjMp6SKuXpc"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {children}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  );
}
