/** Shared parsing and formatting helpers for the emulator. */

export function stripComment(line: string): string {
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === ";") return line.slice(0, i);
  }
  return line;
}

export function parseNumber(tok: string): number | null {
  tok = tok.trim();
  if (/^'.'$/.test(tok) || /^"."$/.test(tok)) return tok.charCodeAt(1);
  if (/^-?[0-9]+$/.test(tok)) return parseInt(tok, 10);
  if (/^0x[0-9a-f]+$/i.test(tok)) return parseInt(tok, 16);
  if (/^[0-9a-f]+h$/i.test(tok)) return parseInt(tok.slice(0, -1), 16);
  if (/^[0-9]+d$/i.test(tok)) return parseInt(tok.slice(0, -1), 10);
  if (/^[01]+b$/i.test(tok)) return parseInt(tok.slice(0, -1), 2);
  return null;
}

export function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: "'" | '"' | null = null;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") out.push(cur);
  return out;
}

export function writeUnit(
  mem: Uint8Array,
  addr: number,
  val: number,
  size: 1 | 2,
): void {
  val = val & (size === 2 ? 0xffff : 0xff);
  mem[addr] = val & 0xff;
  if (size === 2) mem[addr + 1] = (val >> 8) & 0xff;
}

export function parityOf(byte: number): number {
  let b = byte & 0xff;
  let ones = 0;
  while (b) {
    ones += b & 1;
    b >>= 1;
  }
  return ones % 2 === 0 ? 1 : 0;
}

export function hex4(v: number): string {
  return `0x${((v || 0) & 0xffff).toString(16).padStart(4, "0").toUpperCase()}`;
}

export function hex2(v: number): string {
  return ((v || 0) & 0xff).toString(16).padStart(2, "0").toUpperCase();
}

export function encodeProgramToShare(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeProgramFromShare(encoded: string): string | null {
  try {
    let raw = encoded.trim();
    // URLSearchParams usually decodes once; handle leftover encoding / spaces.
    try {
      if (/%[0-9A-Fa-f]{2}/.test(raw)) {
        raw = decodeURIComponent(raw);
      }
    } catch {
      /* keep raw */
    }
    let b64 = raw.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
