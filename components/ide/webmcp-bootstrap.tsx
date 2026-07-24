"use client";

import { useEffect } from "react";
import { APP_AUTHOR, APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/version";

type JsonSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
};

type ModelContext = {
  provideContext: (ctx: { tools: WebMcpTool[] }) => void;
};

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

/**
 * Registers WebMCP tools when the browser supports navigator.modelContext.
 * Source tools read/write via a lightweight custom event bridge on the IDE.
 */
export function WebMcpBootstrap() {
  useEffect(() => {
    const ctx = navigator.modelContext;
    if (!ctx?.provideContext) return;

    const tools: WebMcpTool[] = [
      {
        name: "get_app_info",
        description: "Return emu8086web name, version, tagline, and author.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => ({
          name: APP_NAME,
          version: APP_VERSION,
          tagline: APP_TAGLINE,
          author: APP_AUTHOR.name,
          productSite:
            process.env.NEXT_PUBLIC_SITE_URL ??
            "https://emu-8086-web.vercel.app",
          authorSite: APP_AUTHOR.site,
        }),
      },
      {
        name: "get_source",
        description:
          "Get the current assembly source from the open IDE editor, if available.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          return await new Promise((resolve) => {
            const onReply = (e: Event) => {
              const detail = (e as CustomEvent<{ source?: string }>).detail;
              window.removeEventListener("emu8086web:webmcp-source", onReply);
              resolve({ source: detail?.source ?? "" });
            };
            window.addEventListener("emu8086web:webmcp-source", onReply, {
              once: true,
            });
            window.dispatchEvent(new CustomEvent("emu8086web:webmcp-get-source"));
            setTimeout(() => {
              window.removeEventListener("emu8086web:webmcp-source", onReply);
              resolve({ source: "", error: "IDE not ready" });
            }, 500);
          });
        },
      },
      {
        name: "set_source",
        description:
          "Replace the current assembly source in the open IDE editor (guarded; max 64KiB).",
        inputSchema: {
          type: "object",
          properties: {
            source: { type: "string", description: "Full ASM source text" },
          },
          required: ["source"],
          additionalProperties: false,
        },
        execute: async (args) => {
          const source = typeof args.source === "string" ? args.source : "";
          if (!source) return { ok: false, error: "source required" };
          if (new TextEncoder().encode(source).length > 65_536) {
            return { ok: false, error: "source too large" };
          }
          window.dispatchEvent(
            new CustomEvent("emu8086web:webmcp-set-source", {
              detail: { source },
            }),
          );
          return { ok: true };
        },
      },
    ];

    try {
      ctx.provideContext({ tools });
    } catch {
      // Browser may reject; ignore.
    }
  }, []);

  return null;
}
