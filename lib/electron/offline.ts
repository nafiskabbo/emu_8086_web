/**
 * Pure helpers for the v1.3.0 offline desktop shell.
 *
 * Framework-agnostic (no Electron/Node imports) so the same logic is unit
 * tested with bun and reused by the Electron main process scripts.
 */

/** Default Next dev-server port used for `electron:dev`. */
export const DEFAULT_DEV_PORT = 3000;

/** Lowest user-assignable TCP port for the bundled server. */
export const MIN_PORT = 1024;

/** Highest valid TCP port for the bundled server. */
export const MAX_PORT = 65535;

/**
 * True when a renderer user agent belongs to the Electron shell.
 * Electron appends `<app>/<version> ... Electron/<version>` to the UA.
 */
export function isElectronUserAgent(
  userAgent: string | null | undefined,
): boolean {
  if (!userAgent) return false;
  return /\bElectron\//i.test(userAgent);
}

/** Loopback URL of the bundled Next server on the given port. */
export function buildLocalAppUrl(port: number): string {
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new RangeError(`Invalid server port: ${String(port)}`);
  }
  return `http://127.0.0.1:${port}`;
}

/** Health-check URL used to wait for the bundled server before showing UI. */
export function buildHealthUrl(port: number): string {
  return `${buildLocalAppUrl(port)}/api/health`;
}

/**
 * Parse a port from env/argv, falling back when missing or out of range.
 * Short share links need the network, so callers gate them on `online`.
 */
export function normalizeServerPort(
  raw: unknown,
  fallback: number = DEFAULT_DEV_PORT,
): number {
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number.parseInt(raw, 10)
        : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < MIN_PORT || parsed > MAX_PORT) {
    return fallback;
  }
  return parsed;
}

/** Short share links are server-backed, so they are disabled while offline. */
export function shouldDisableShare(online: boolean): boolean {
  return !online;
}

/**
 * True when running inside the Electron desktop shell. Prefers the preload
 * bridge, falls back to the user-agent token. SSR-safe (returns false).
 */
export function isElectronRenderer(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (window.electronAPI?.isElectron() === true) return true;
  return isElectronUserAgent(navigator.userAgent);
}

/** Absolute path of the Next standalone server inside packaged resources. */
export function resolveStandaloneServerPath(resourcesPath: string): string {
  return `${resourcesPath.replace(/\/$/, "")}/.next/standalone/server.js`;
}
