import { decodeProgramFromShare } from "@/lib/emulator";

/**
 * In-memory share payload for this JS realm.
 * Survives React Strict Mode remounts after the URL query is cleared.
 * Resets on full page reload.
 */
let memoryShare: string | null | undefined;

/**
 * Read `?p=` (legacy inline) or `?s=` (short code pending fetch) from the URL.
 * After the query is cleared, returns the previously decoded program for the
 * rest of this page load.
 */
export function takeSharedSourceFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get("p");
  if (raw) {
    memoryShare = decodeProgramFromShare(raw);
    return memoryShare;
  }

  if (memoryShare !== undefined) return memoryShare;

  memoryShare = null;
  return null;
}

/** Short share code from `?s=` or `/s/<code>` boot handoff. */
export function takeShareCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("s");
  return code?.trim().toLowerCase() || null;
}

export function clearShareQueryFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("p") && !params.has("s")) return;
  window.history.replaceState({}, "", window.location.pathname);
}

export function setMemoryShare(source: string | null): void {
  memoryShare = source;
}
