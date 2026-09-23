/**
 * Offline/Electron helper tests (v1.3.0 desktop shell).
 * Run: bun test lib/electron
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHealthUrl,
  buildLocalAppUrl,
  DEFAULT_DEV_PORT,
  isElectronUserAgent,
  normalizeServerPort,
  resolveStandaloneServerPath,
  shouldDisableShare,
} from "./offline";

describe("isElectronUserAgent", () => {
  it("detects the Electron token in a renderer user agent", () => {
    assert.equal(
      isElectronUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) emu8086web/1.3.0 Chrome/138.0.0.0 Electron/37.2.0 Safari/537.36",
      ),
      true,
    );
  });

  it("rejects plain browser user agents", () => {
    assert.equal(
      isElectronUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      ),
      false,
    );
  });

  it("handles empty input without throwing", () => {
    assert.equal(isElectronUserAgent(""), false);
    assert.equal(isElectronUserAgent(null), false);
    assert.equal(isElectronUserAgent(undefined), false);
  });
});

describe("buildLocalAppUrl / buildHealthUrl", () => {
  it("builds a loopback URL for the bundled server", () => {
    assert.equal(buildLocalAppUrl(3000), "http://127.0.0.1:3000");
    assert.equal(buildLocalAppUrl(52341), "http://127.0.0.1:52341");
  });

  it("rejects out-of-range ports", () => {
    assert.throws(() => buildLocalAppUrl(0), RangeError);
    assert.throws(() => buildLocalAppUrl(70000), RangeError);
    assert.throws(() => buildLocalAppUrl(-1), RangeError);
  });

  it("derives the health-check URL from the app URL", () => {
    assert.equal(buildHealthUrl(3000), "http://127.0.0.1:3000/api/health");
  });
});

describe("normalizeServerPort", () => {
  it("accepts valid ports as string or number", () => {
    assert.equal(normalizeServerPort("3000"), 3000);
    assert.equal(normalizeServerPort(52341), 52341);
  });

  it("falls back for missing or invalid values", () => {
    assert.equal(normalizeServerPort(undefined), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort(null), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort(""), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort("not-a-port"), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort(0), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort(99999), DEFAULT_DEV_PORT);
    assert.equal(normalizeServerPort(Number.NaN), DEFAULT_DEV_PORT);
  });

  it("honors a custom fallback", () => {
    assert.equal(normalizeServerPort(undefined, 4100), 4100);
  });
});

describe("shouldDisableShare", () => {
  it("disables short share links while offline (web or desktop)", () => {
    assert.equal(shouldDisableShare(false), true);
  });

  it("keeps share enabled while online", () => {
    assert.equal(shouldDisableShare(true), false);
  });
});

describe("resolveStandaloneServerPath", () => {
  it("points at the bundled Next standalone server", () => {
    assert.equal(
      resolveStandaloneServerPath("/Applications/emu8086web.app/Contents/Resources"),
      "/Applications/emu8086web.app/Contents/Resources/.next/standalone/server.js",
    );
  });

  it("tolerates a trailing slash", () => {
    assert.equal(
      resolveStandaloneServerPath("/tmp/resources/"),
      "/tmp/resources/.next/standalone/server.js",
    );
  });
});
