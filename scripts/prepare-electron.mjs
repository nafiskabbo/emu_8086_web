/**
 * Prepare the Next standalone build for Electron packaging.
 *
 * Copies `public/` and `.next/static` into `.next/standalone/` so the
 * bundled server (`electron/main.js`) is self-contained, then verifies the
 * server entry exists. Run after `bun run build`.
 *
 * Usage: node scripts/prepare-electron.mjs
 */
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");
const serverFile = path.join(standaloneDir, "server.js");

if (!existsSync(serverFile)) {
  console.error(
    "Missing .next/standalone/server.js — did `bun run build` run with `output: \"standalone\"`?",
  );
  process.exit(1);
}

// Next standalone docs: static assets and public files must sit alongside
// server.js for the bundled server to serve them offline.
cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), {
  recursive: true,
});
cpSync(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
  { recursive: true },
);

console.log("Electron package staged at .next/standalone");
