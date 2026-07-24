"use client";

import { useEffect, useRef, useState } from "react";
import { AdSenseUnit, AD_SLOTS } from "@/components/ads/adsense-unit";
import { AuthorContacts } from "@/components/ide/author-contacts";
import { DialogShell } from "@/components/ide/dialog-shell";
import { IconGitHub } from "@/components/ide/editor-icons";
import { ShortcutsHelp } from "@/components/ide/shortcuts-help";
import { CHANGELOG } from "@/lib/changelog";
import {
  formatShortcutLabel,
  loadOsView,
  loadOverrides,
  loadScheme,
  type OsView,
  type OverrideMap,
  type ShortcutId,
  type ShortcutScheme,
} from "@/lib/ide/shortcuts";
import { APP_AUTHOR, APP_NAME, APP_REPO_URL, APP_TAGLINE, APP_VERSION } from "@/lib/version";


export type HelpPanel =
  | null
  | "menu"
  | "ascii"
  | "convert"
  | "shortcuts"
  | "changelog"
  | "about";

export const OPEN_HELP_EVENT = "emu8086web:open-help";

interface HelpMenuProps {
  onOpenSettings: () => void;
}

const PANEL_META: Record<
  Exclude<HelpPanel, null | "menu">,
  { title: string; wide?: boolean }
> = {
  ascii: { title: "ASCII codes", wide: true },
  convert: { title: "Number converter" },
  shortcuts: { title: "Keyboard shortcuts" },
  changelog: { title: "Changelog" },
  about: { title: `About ${APP_NAME}` },
};

/** Help dropdown rows that have a bound ShortcutId. */
const MENU_ITEMS: {
  id: Exclude<HelpPanel, null | "menu">;
  label: string;
  shortcutId?: ShortcutId;
}[] = [
  { id: "ascii", label: "ASCII codes", shortcutId: "ascii" },
  { id: "convert", label: "Number converter", shortcutId: "convert" },
  { id: "shortcuts", label: "Keyboard shortcuts", shortcutId: "shortcuts" },
  { id: "changelog", label: "Changelog" },
  { id: "about", label: "About" },
];

export function HelpMenu({ onOpenSettings }: HelpMenuProps) {
  const [panel, setPanel] = useState<HelpPanel>(null);
  const [scheme, setScheme] = useState<ShortcutScheme>("intellij");
  const [osView, setOsView] = useState<OsView>("auto");
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const reloadShortcutPrefs = () => {
    setScheme(loadScheme());
    setOsView(loadOsView());
    setOverrides(loadOverrides());
  };

  useEffect(() => {
    queueMicrotask(reloadShortcutPrefs);
    window.addEventListener("emu8086web:shortcuts-changed", reloadShortcutPrefs);
    return () =>
      window.removeEventListener(
        "emu8086web:shortcuts-changed",
        reloadShortcutPrefs,
      );
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (panel === "menu") setPanel(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [panel]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ panel?: HelpPanel }>).detail;
      setPanel(detail?.panel ?? "shortcuts");
    };
    window.addEventListener(OPEN_HELP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_HELP_EVENT, onOpen);
  }, []);

  const dialogPanel =
    panel && panel !== "menu" ? panel : null;
  const meta = dialogPanel ? PANEL_META[dialogPanel] : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (!panel) reloadShortcutPrefs();
          setPanel((p) => (p ? null : "menu"));
        }}
        title="Help"
      >
        Help
      </button>

      {panel === "menu" && (
        <div className="absolute top-full right-0 z-40 mt-1 min-w-[260px] border border-line bg-panel py-1 shadow-xl">
          {MENU_ITEMS.map(({ id, label, shortcutId }) => {
            const chord = shortcutId
              ? formatShortcutLabel(shortcutId, scheme, osView, overrides)
              : null;
            return (
              <button
                key={id}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-xs text-ink hover:bg-panel-2 hover:text-amber"
                onClick={() => setPanel(id)}
              >
                <span>{label}</span>
                {chord ? (
                  <kbd className="shrink-0 rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
                    {chord}
                  </kbd>
                ) : null}
              </button>
            );
          })}
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

      <DialogShell
        open={!!dialogPanel}
        onClose={() => setPanel(null)}
        title={meta?.title ?? ""}
        panelClassName={meta?.wide ? "max-w-5xl" : "max-w-lg"}
        footer={
          <>
            <div className="border-t border-line/60 pt-3">
              <AdSenseUnit
                key={dialogPanel ?? "none"}
                slot={AD_SLOTS.banner3}
                compact
              />
            </div>
          </>
        }
      >
        {dialogPanel === "ascii" && <AsciiTable />}
        {dialogPanel === "convert" && <NumberConverter />}
        {dialogPanel === "shortcuts" && <ShortcutsHelp />}
        {dialogPanel === "changelog" && <ChangelogPanel />}
        {dialogPanel === "about" && <AboutPanel />}
      </DialogShell>
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
      <p className="text-sm text-ink-dim">
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
  const n = parseFlexible(raw);

  return (
    <>
      <p className="text-xs text-ink-dim">
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
  if (/^'.'$/.test(t) || /^"."$/.test(t)) return t.charCodeAt(1);
  if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16);
  if (/^[0-9a-f]+h$/i.test(t)) return parseInt(t.slice(0, -1), 16);
  if (/^[01]+b$/i.test(t)) return parseInt(t.slice(0, -1), 2);
  if (/^-?[0-9]+$/.test(t)) return parseInt(t, 10);
  return null;
}

function ChangelogPanel() {
  return (
    <>
      <p className="text-xs text-ink-dim">What&apos;s new in {APP_NAME}</p>
      <div className="mt-4 space-y-5">
        {CHANGELOG.map((entry) => (
          <section key={entry.version}>
            <h3 className="font-mono text-sm text-ink">
              v{entry.version}{" "}
              <span className="text-xs text-ink-dim">· {entry.date}</span>
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-dim">
              {entry.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <p className="text-sm text-ink">{APP_TAGLINE}</p>
      <p className="mt-3 text-sm text-ink-dim">
        Tried to modernize classic emu8086 for the browser so students and
        developers can assemble and debug 8086 programs on every platform —
        Windows, macOS, Linux, and mobile browsers.
      </p>
      <dl className="mt-4 space-y-2 font-mono text-sm">
        <Row label="Version" value={APP_VERSION} />
        <Row label="Developed by" value={APP_AUTHOR.name} />
        <Row label="Email" value={APP_AUTHOR.email} />
        <div className="flex justify-between gap-4 border-b border-line/40 py-1">
          <dt className="text-ink-dim">Repository</dt>
          <dd className="min-w-0 text-right">
            <a
              href={APP_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-end gap-1.5 break-all text-amber hover:underline"
            >
              <IconGitHub className="h-3.5 w-3.5 shrink-0" />
              emu_8086_web
            </a>
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <p className="mb-2 text-xs tracking-wider text-ink-dim uppercase">
          Connect & contribute
        </p>
        <AuthorContacts />
      </div>
    </>
  );
}
