import { siteConfig } from "@/lib/seo";

export function GET() {
  const base = siteConfig.url.replace(/\/$/, "");
  const body = `# emu8086web robots
User-agent: *
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: GPTBot
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: ChatGPT-User
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: Google-Extended
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: anthropic-ai
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

User-agent: ClaudeBot
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes

Sitemap: ${base}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
