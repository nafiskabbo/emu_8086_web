"use client";

import { useCallback, useEffect, useState } from "react";
import {
  chordFromEvent,
  detectIsMac,
  formatChord,
  formatChordBoth,
  getEffectiveChord,
  loadOsView,
  loadOverrides,
  loadScheme,
  OS_VIEW_KEY,
  OVERRIDES_KEY,
  resolveOsView,
  saveOverrides,
  SCHEME_KEY,
  SHORTCUT_DEFS,
  type Chord,
  type OsView,
  type OverrideMap,
  type ShortcutId,
  type ShortcutScheme,
} from "@/lib/ide/shortcuts";

function notifyShortcutsChanged() {
  window.dispatchEvent(new Event("emu8086web:shortcuts-changed"));
}

export function ShortcutsHelp() {
  const [scheme, setScheme] = useState<ShortcutScheme>("intellij");
  const [osView, setOsView] = useState<OsView>("auto");
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [recording, setRecording] = useState<ShortcutId | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setScheme(loadScheme());
      setOsView(loadOsView());
      setOverrides(loadOverrides());
    });
  }, []);

  const resolved = resolveOsView(osView);

  const persistScheme = (s: ShortcutScheme) => {
    setScheme(s);
    localStorage.setItem(SCHEME_KEY, s);
    notifyShortcutsChanged();
  };

  const persistOs = (v: OsView) => {
    setOsView(v);
    localStorage.setItem(OS_VIEW_KEY, v);
    notifyShortcutsChanged();
  };

  const persistOverrides = (map: OverrideMap) => {
    setOverrides(map);
    saveOverrides(map);
    notifyShortcutsChanged();
  };

  const onRecordKey = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setRecording(null);
        return;
      }
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      const chord = chordFromEvent(e);
      const os: "mac" | "windows" = detectIsMac() ? "mac" : "windows";
      setOverrides((prev) => {
        const next: OverrideMap = {
          ...prev,
          [recording]: {
            ...prev[recording],
            [os === "mac" ? "mac" : "win"]: chord,
          },
        };
        saveOverrides(next);
        notifyShortcutsChanged();
        return next;
      });
      setRecording(null);
    },
    [recording],
  );

  useEffect(() => {
    if (!recording) return;
    window.addEventListener("keydown", onRecordKey, true);
    return () => window.removeEventListener("keydown", onRecordKey, true);
  }, [onRecordKey, recording]);

  const labelFor = (id: ShortcutId, defMac: Chord, defWin: Chord) => {
    const mac = getEffectiveChord(
      SHORTCUT_DEFS.find((d) => d.id === id)!,
      scheme,
      "mac",
      overrides,
    );
    const win = getEffectiveChord(
      SHORTCUT_DEFS.find((d) => d.id === id)!,
      scheme,
      "windows",
      overrides,
    );
    void defMac;
    void defWin;
    if (resolved === "both") return formatChordBoth(mac, win);
    return formatChord(resolved === "mac" ? mac : win, resolved);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-[10px] tracking-wider text-ink-dim uppercase">
          Shortcut style
          <select
            className="mt-1 block w-full min-w-[140px] rounded border border-line bg-panel-2 px-2 py-1.5 font-mono text-xs text-ink"
            value={scheme}
            onChange={(e) =>
              persistScheme(e.target.value as ShortcutScheme)
            }
          >
            <option value="intellij">IntelliJ</option>
            <option value="vscode">VS Code</option>
          </select>
        </label>
        <div>
          <span className="block text-[10px] tracking-wider text-ink-dim uppercase">
            Show keys as
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {(
              [
                ["auto", "Auto"],
                ["mac", "Mac"],
                ["windows", "Windows"],
                ["both", "Both"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn text-[10px] ${osView === id ? "btn-primary" : ""}`}
                onClick={() => persistOs(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn text-[10px]"
          onClick={() => {
            localStorage.removeItem(OVERRIDES_KEY);
            persistOverrides({});
          }}
        >
          Reset custom
        </button>
      </div>
      <p className="mt-2 text-[11px] text-ink-dim">
        Auto uses {detectIsMac() ? "Mac" : "Windows"} layout. Click a shortcut,
        then press a new chord to customize (saved for this device).
        {recording ? (
          <span className="ml-1 text-amber">
            Recording {recording}… press keys (Esc cancels)
          </span>
        ) : null}
      </p>

      <ul className="mt-4 space-y-2">
        {SHORTCUT_DEFS.map((def) => {
          const mac = def[scheme].mac;
          const win = def[scheme].win;
          return (
            <li
              key={def.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 text-ink-dim">{def.action}</span>
              <button
                type="button"
                className={`shrink-0 rounded border px-2 py-0.5 font-mono text-xs ${
                  recording === def.id
                    ? "border-amber text-amber"
                    : "border-line bg-panel-2 text-ink hover:border-amber"
                }`}
                title="Click to remap"
                onClick={() =>
                  setRecording((r) => (r === def.id ? null : def.id))
                }
              >
                {labelFor(def.id, mac, win)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
