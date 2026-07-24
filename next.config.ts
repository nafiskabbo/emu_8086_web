import type { NextConfig } from "next";

const linkHeader = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
].join(", ");

const nextConfig: NextConfig = {
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
