import type { NextConfig } from "next";

const linkHeader = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
].join(", ");

const nextConfig: NextConfig = {
  // Standalone server output feeds the offline Electron shell
  // (`electron/dist:mac` forks `.next/standalone/server.js`).
  // Vercel continues to deploy from the same build.
  output: "standalone",
  // The Electron dev shell loads the app over loopback (127.0.0.1), which
  // Next treats as cross-origin for dev resources (HMR + client chunks).
  // Without this, hydration stalls and clicks do nothing in `electron:dev`.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Link", value: linkHeader }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Signal",
            value: "ai-train=yes, search=yes, ai-input=yes",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
