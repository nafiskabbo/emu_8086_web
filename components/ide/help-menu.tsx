"use client";

import { useEffect, useRef, useState } from "react";
import { APP_AUTHOR, APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/version";

type HelpPanel =
  | null
  | "menu"
  | "ascii"
  | "convert"
  | "shortcuts"
  | "about";

interface HelpMenuProps {
  onOpenSettings: () => void;
}

export function HelpMenu({ onOpenSettings }: HelpMenuProps) {
  const [panel, setPanel] = useState<HelpPanel>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panel) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [panel]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="btn"
        onClick={() => setPanel((p) => (p ? null : "menu"))}
        title="Help"
      >
        Help
      </button>

      {panel === "menu" && (
        <div className="absolute top-full right-0 z-40 mt-1 min-w-[220px] border border-line bg-panel py-1 shadow-xl">
          {(
            [
              ["ascii", "ASCII codes"],
              ["convert", "Number converter"],
              ["shortcuts", "Keyboard shortcuts"],
              ["about", "About"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="block w-full px-3 py-2 text-left text-xs text-ink hover:bg-panel-2 hover:text-amber"
              onClick={() => setPanel(id)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="block w-full border-t border-line px-3 py-2 text-left text-xs text-ink hover:bg-panel-2 hover:text-amber"
            onClick={() => {
              setPanel(null);
              onOpenSettings();
            }}
          >
            Settings…
          </button>
        </div>
      )}

      {panel && panel !== "menu" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6"
          onClick={() => setPanel(null)}
        >
          <div
            className={`max-h-[90dvh] w-full overflow-auto border border-line bg-panel p-4 shadow-2xl sm:p-6 ${
              panel === "ascii" ? "max-w-5xl" : "max-w-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {panel === "ascii" && <AsciiTable />}
            {panel === "convert" && <NumberConverter />}
            {panel === "shortcuts" && <ShortcutsHelp />}
            {panel === "about" && <AboutPanel />}
            <button
              type="button"
              className="btn mt-4 w-full"
              onClick={() => setPanel(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ASCII_NAMES: Record<number, string> = {
  0: "NUL",
  1: "SOH",
  2: "STX",
  3: "ETX",
  4: "EOT",
  5: "ENQ",
  6: "ACK",
  7: "BEL",
  8: "BS",
  9: "TAB",
  10: "LF",
  11: "VT",
  12: "FF",
  13: "CR",
  14: "SO",
  15: "SI",
  16: "DLE",
  17: "DC1",
  18: "DC2",
  19: "DC3",
  20: "DC4",
  21: "NAK",
  22: "SYN",
  23: "ETB",
  24: "CAN",
  25: "EM",
  26: "SUB",
  27: "ESC",
  28: "FS",
  29: "GS",
  30: "RS",
  31: "US",
  32: "SPACE",
  127: "DEL",
};

function asciiLabel(code: number): string {
  if (ASCII_NAMES[code] !== undefined) return ASCII_NAMES[code]!;
  if (code > 32 && code < 127) return String.fromCharCode(code);
  return "·";
}

function AsciiTable() {
  const cells = Array.from({ length: 128 }, (_, code) => ({
    code,
    ch: asciiLabel(code),
  }));

  return (
    <>
      <h2 className="font-mono text-base font-semibold tracking-wider text-amber uppercase sm:text-lg">
        ASCII codes
      </h2>
      <p className="mt-1 text-sm text-ink-dim">
        0–127 reference · Dec · Char · Hex — control chars use standard names
        (TAB, SPACE, CR, LF…)
      </p>
      <div className="mt-4 grid grid-cols-2 gap-1.5 font-mono text-xs sm:grid-cols-4 sm:gap-2 sm:text-sm md:grid-cols-6 lg:grid-cols-8">
        {cells.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between gap-2 rounded border border-line/70 bg-panel-2/40 px-2 py-1.5 sm:px-2.5 sm:py-2"
          >
            <span className="min-w-[2ch] text-amber tabular-nums">{c.code}</span>
            <span
              className={`min-w-[3.5ch] text-center ${
                ASCII_NAMES[c.code] !== undefined
                  ? "text-[10px] tracking-wide text-ink-dim uppercase sm:text-[11px]"
                  : "text-ink"
              }`}
            >
              {c.ch}
            </span>
            <span className="text-ink-dim tabular-nums">
              {c.code.toString(16).padStart(2, "0").toUpperCase()}h
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function NumberConverter() {
  const [raw, setRaw] = useState("255");
  const parsed = parseFlexible(raw);
  const n = parsed;

  return (
    <>
      <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
        Number converter
      </h2>
      <p className="mt-1 text-xs text-ink-dim">
        Enter decimal, 0xFF, FFh, 11111111b, or &apos;A&apos;
      </p>
      <input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="mt-3 w-full rounded border border-line bg-panel-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-amber"
      />
      {n === null ? (
        <p className="mt-3 text-xs text-red">Invalid number</p>
      ) : (
        <dl className="mt-3 space-y-2 font-mono text-sm">
          <Row label="Decimal" value={String(n >>> 0)} />
          <Row label="Hex" value={`0x${(n >>> 0).toString(16).toUpperCase()}`} />
          <Row label="Binary" value={(n >>> 0).toString(2)} />
          <Row
            label="ASCII"
            value={
              n >= 0 && n <= 127
                ? ASCII_NAMES[n] !== undefined
                  ? ASCII_NAMES[n]!
                  : `'${String.fromCharCode(n)}'`
                : "—"
            }
          />
          <Row label="Signed 16" value={String((n << 16) >> 16)} />
        </dl>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/40 py-1">
      <dt className="text-ink-dim">{label}</dt>
      <dd className="text-ink break-all">{value}</dd>
    </div>
  );
}

function parseFlexible(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^'.'$/.test(t)) return t.charCodeAt(1);
  if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16);
  if (/^[0-9a-f]+h$/i.test(t)) return parseInt(t.slice(0, -1), 16);
  if (/^[01]+b$/i.test(t)) return parseInt(t.slice(0, -1), 2);
  if (/^-?[0-9]+$/.test(t)) return parseInt(t, 10);
  return null;
}

function ShortcutsHelp() {
  const items = [
    ["F5", "Compile / Assemble"],
    ["F8", "Single step"],
    ["Esc", "Pause"],
    ["Ctrl/Cmd+S", "Save active file"],
    ["?", "Shortcuts"],
  ];
  return (
    <>
      <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
        Keyboard shortcuts
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map(([k, a]) => (
          <li key={k} className="flex justify-between text-sm">
            <kbd className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs">
              {k}
            </kbd>
            <span className="text-ink-dim">{a}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
        About {APP_NAME}
      </h2>
      <p className="mt-3 text-sm text-ink">{APP_TAGLINE}</p>
      <p className="mt-3 text-sm text-ink-dim">
        Tried to modernize classic emu8086 for the browser so students and
        developers can assemble and debug 8086 programs on every platform —
        Windows, macOS, Linux, and mobile browsers.
      </p>
      <dl className="mt-4 space-y-2 font-mono text-sm">
        <Row label="Version" value={APP_VERSION} />
        <Row label="Developed by" value={APP_AUTHOR.name} />
      </dl>
    </>
  );
}
