/**
 * Local Electron dev runner (no extra dependencies).
 *
 * Starts `next dev`, waits for /api/health, then opens Electron pointed at
 * it via ELECTRON_START_URL. Ctrl+C stops both processes.
 *
 * Usage: bun run electron:dev
 */
import { spawn } from "node:child_process";
import http from "node:http";

const PORT = process.env.PORT || "3000";
const HEALTH_URL = `http://127.0.0.1:${PORT}/api/health`;

const children = new Set();
function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: "inherit", ...opts });
  children.add(child);
  child.on("exit", (code) => {
    children.delete(child);
    if (code !== 0 && code !== null) shutdown(code);
  });
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function waitForHealth(deadline) {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(HEALTH_URL, { timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
        } else if (Date.now() > deadline) {
          reject(new Error("next dev did not become healthy in time"));
        } else {
          setTimeout(poll, 300);
        }
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error("next dev did not become healthy in time"));
        } else {
          setTimeout(poll, 300);
        }
      });
      req.on("timeout", () => {
        req.destroy();
        // A timed-out probe emits no response/error — keep polling.
        if (Date.now() > deadline) {
          reject(new Error("next dev did not become healthy in time"));
        } else {
          setTimeout(poll, 300);
        }
      });
    };
    poll();
  });
}

run("bun", ["run", "dev"], { env: { ...process.env, PORT } });

try {
  await waitForHealth(Date.now() + 60000);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  shutdown(1);
}

run("bunx", ["electron", ".", "--no-sandbox"], {
  // --no-sandbox is dev-only: macOS denies the sandboxed dev Helper file
  // access (sandbox_extension_issue_file … Operation not permitted), which
  // can leave the window unresponsive. Packaged builds keep the sandbox.
  env: { ...process.env, ELECTRON_START_URL: `http://127.0.0.1:${PORT}` },
});
