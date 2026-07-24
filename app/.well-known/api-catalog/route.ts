import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/seo";

export function GET() {
  const base = siteConfig.url.replace(/\/$/, "");

  const body = {
    linkset: [
      {
        anchor: `${base}/api/share`,
        "service-desc": [
          {
            href: `${base}/.well-known/agent-skills/share-api/SKILL.md`,
            type: "text/markdown",
          },
        ],
        "service-doc": [
          {
            href: `${base}/llms.txt`,
            type: "text/plain",
          },
        ],
        status: [
          {
            href: `${base}/api/health`,
            type: "application/json",
          },
        ],
      },
      {
        anchor: `${base}/api/health`,
        "service-doc": [
          {
            href: `${base}/llms.txt`,
            type: "text/plain",
          },
        ],
      },
    ],
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
