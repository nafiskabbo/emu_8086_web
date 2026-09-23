/**
 * Ads feature-flag tests. Ads default to OFF (web and desktop).
 * Run: bun test lib
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isAdsEnabled } from "./adsense";

const KEY = "NEXT_PUBLIC_ENABLE_ADS";
const saved = process.env[KEY];

afterEach(() => {
  if (saved === undefined) delete process.env[KEY];
  else process.env[KEY] = saved;
});

describe("isAdsEnabled", () => {
  it("defaults to off when unset", () => {
    delete process.env[KEY];
    assert.equal(isAdsEnabled(), false);
  });

  it("defaults to off when blank", () => {
    process.env[KEY] = "";
    assert.equal(isAdsEnabled(), false);
  });

  it("enables on '1' or 'true' (any case)", () => {
    for (const v of ["1", "true", "TRUE", " True "]) {
      process.env[KEY] = v;
      assert.equal(isAdsEnabled(), true, v);
    }
  });

  it("stays off for anything else", () => {
    for (const v of ["0", "false", "yes", "on", "ads"]) {
      process.env[KEY] = v;
      assert.equal(isAdsEnabled(), false, v);
    }
  });
});
