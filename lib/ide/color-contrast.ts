/** Relative luminance 0–1 (sRGB). */
export function relativeLuminance(hex: string): number {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return 0.5;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = lin(parseInt(m[1], 16));
  const g = lin(parseInt(m[2], 16));
  const b = lin(parseInt(m[3], 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Foreground that contrasts with the accent (for primary buttons). */
export function contrastForeground(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0a0f1a" : "#ffffff";
}
