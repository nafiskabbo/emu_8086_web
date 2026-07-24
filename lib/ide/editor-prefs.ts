export const TAB_SIZE_KEY = "emu8086web:tabSize";
export const WORD_WRAP_KEY = "emu8086web:wordWrap";
export const ACCENT_KEY = "emu8086web:accent";
export const FONT_SCALE_KEY = "emu8086web:fontScale";

export const DEFAULT_TAB_SIZE = 4;
export const DEFAULT_ACCENT_DARK = "#64d2ff";
export const DEFAULT_ACCENT_LIGHT = "#b3690a";

export type TabSize = 2 | 4 | 8;

export function loadTabSize(): TabSize {
  if (typeof window === "undefined") return DEFAULT_TAB_SIZE;
  const n = Number(localStorage.getItem(TAB_SIZE_KEY));
  if (n === 2 || n === 4 || n === 8) return n;
  return DEFAULT_TAB_SIZE;
}

export function loadWordWrap(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WORD_WRAP_KEY) === "1";
}

export function loadAccent(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(ACCENT_KEY);
  return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null;
}

/** Derive a dimmed companion color for --amber-dim. */
export function dimAccent(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const mix = (c: number) => Math.round(c * 0.45 + 0x20 * 0.55);
  const r = mix(parseInt(m[1], 16));
  const g = mix(parseInt(m[2], 16));
  const b = mix(parseInt(m[3], 16));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function applyAccent(hex: string | null, theme: "dark" | "light"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!hex) {
    root.style.removeProperty("--amber");
    root.style.removeProperty("--amber-dim");
    root.style.removeProperty("--amber-fg");
    return;
  }
  root.style.setProperty("--amber", hex);
  root.style.setProperty("--amber-dim", dimAccent(hex));
  // dynamic import avoided — inline luminance
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  let fg = "#0a0f1a";
  if (m) {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const L =
      0.2126 * lin(parseInt(m[1], 16)) +
      0.7152 * lin(parseInt(m[2], 16)) +
      0.0722 * lin(parseInt(m[3], 16));
    fg = L > 0.45 ? "#0a0f1a" : "#ffffff";
  }
  root.style.setProperty("--amber-fg", fg);
  void theme;
}

export function defaultAccentForTheme(theme: "dark" | "light"): string {
  return theme === "light" ? DEFAULT_ACCENT_LIGHT : DEFAULT_ACCENT_DARK;
}
