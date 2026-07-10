import { decodeProgramFromShare } from "@/lib/emulator";

/**
 * In-memory share payload for this JS realm.
 * Survives React Strict Mode remounts after the URL `?p=` is cleared.
 * Resets on full page reload.
 */
let memoryShare: string | null | undefined;

/**
 * Read `?p=` from the URL. After the query is cleared, returns the
 * previously decoded program for the rest of this page load.
 */
export function takeSharedSourceFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const raw = new URLSearchParams(window.location.search).get("p");
  if (raw) {
    memoryShare = decodeProgramFromShare(raw);
    return memoryShare;
  }

  if (memoryShare !== undefined) return memoryShare;

  memoryShare = null;
  return null;
}

export function clearShareQueryFromUrl(): void {
  if (typeof window === "undefined") return;
  if (!new URLSearchParams(window.location.search).has("p")) return;
  window.history.replaceState({}, "", window.location.pathname);
}
