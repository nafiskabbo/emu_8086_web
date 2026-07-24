import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APP_AUTHOR, APP_NAME, APP_REPO_URL, APP_TAGLINE, APP_VERSION } from "@/lib/version";


const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://emu8086web.vercel.app";

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept.split(",").map((p) => p.trim().toLowerCase());
  let mdQ = -1;
  let htmlQ = -1;
  for (const part of parts) {
    const [type, ...params] = part.split(";").map((s) => s.trim());
    const qParam = params.find((p) => p.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (Number.isNaN(q)) continue;
    if (type === "text/markdown" || type === "text/*" || type === "*/*") {
      if (type === "text/markdown") mdQ = Math.max(mdQ, q);
      else if (mdQ < 0) mdQ = Math.max(mdQ, q * 0.1);
    }
    if (type === "text/html") htmlQ = Math.max(htmlQ, q);
  }
  if (mdQ < 0) return false;
  if (htmlQ < 0) return true;
  return mdQ >= htmlQ;
}

function homeMarkdown(): string {
  return `---
title: ${APP_NAME} — 8086 Assembler & Emulator
description: ${APP_TAGLINE}
---

# ${APP_NAME}

${APP_TAGLINE}

**Version:** ${APP_VERSION}  
**Author:** [${APP_AUTHOR.name}](${APP_AUTHOR.site})  
**Product site:** ${SITE_URL}  
**Author portfolio:** ${APP_AUTHOR.site}  
**Repository:** [${APP_REPO_URL}](${APP_REPO_URL}) (open source — contributions welcome)

## What it is

Open-source browser IDE for writing, assembling, and step-debugging Intel 8086 assembly (MASM-style). Runs entirely in the browser.

## Key URLs

- IDE: ${SITE_URL}/
- LLM context: ${SITE_URL}/llms.txt
- API catalog: ${SITE_URL}/.well-known/api-catalog
- Agent skills: ${SITE_URL}/.well-known/agent-skills/index.json
- Health: ${SITE_URL}/api/health
- Share API: POST ${SITE_URL}/api/share · GET ${SITE_URL}/api/share/{code}
- Short share links: ${SITE_URL}/s/{code}

## Agent notes

- No login required.
- Share links expire in 1, 3, or 7 days.
- Prefer \`Accept: text/markdown\` for this summary; HTML remains the default for browsers.
`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" &&
    prefersMarkdown(request.headers.get("accept"))
  ) {
    const body = homeMarkdown();
    const tokens = Math.ceil(body.length / 4);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept",
        "Cache-Control": "public, max-age=300",
        "x-markdown-tokens": String(tokens),
        "Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
