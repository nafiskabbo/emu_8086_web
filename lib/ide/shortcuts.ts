/**
 * Keyboard shortcut schemes (IntelliJ / VS Code) with Mac / Windows chords.
 * Users can override chords; prefs persist in localStorage.
 */

export type ShortcutScheme = "intellij" | "vscode";
export type OsView = "auto" | "mac" | "windows" | "both";

export type Chord = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export type ShortcutId =
  | "assemble"
  | "step"
  | "pause"
  | "save"
  | "shortcuts"
  | "ascii"
  | "convert"
  | "formatDocument"
  | "formatSelection"
  | "undo"
  | "redo"
  | "indent"
  | "outdent"
  | "duplicateLine"
  | "moveLineUp"
  | "moveLineDown"
  | "deleteLine"
  | "toggleComment";

export type ShortcutDef = {
  id: ShortcutId;
  action: string;
  /** When true, only shown in help list (handled natively / elsewhere). */
  displayOnly?: boolean;
  intellij: { mac: Chord; win: Chord };
  vscode: { mac: Chord; win: Chord };
};

export const SCHEME_KEY = "emu8086web:shortcutScheme";
export const OS_VIEW_KEY = "emu8086web:shortcutOsView";
export const OVERRIDES_KEY = "emu8086web:shortcutOverrides";

const k = (
  key: string,
  mods: Partial<Omit<Chord, "key">> = {},
): Chord => ({ key, ...mods });

/** Default bindings — IntelliJ-style format uses Mod+Alt+F / Mod+Alt+Shift+F. */
export const SHORTCUT_DEFS: ShortcutDef[] = [
  {
    id: "assemble",
    action: "Compile / Assemble",
    intellij: { mac: k("F5"), win: k("F5") },
    vscode: { mac: k("F5"), win: k("F5") },
  },
  {
    id: "step",
    action: "Single step",
    intellij: { mac: k("F8"), win: k("F8") },
    vscode: { mac: k("F8"), win: k("F8") },
  },
  {
    id: "pause",
    action: "Pause execution / close dialog",
    intellij: { mac: k("Escape"), win: k("Escape") },
    vscode: { mac: k("Escape"), win: k("Escape") },
  },
  {
    id: "save",
    action: "Save active file",
    intellij: { mac: k("s", { meta: true }), win: k("s", { ctrl: true }) },
    vscode: { mac: k("s", { meta: true }), win: k("s", { ctrl: true }) },
  },
  {
    id: "shortcuts",
    action: "Open keyboard shortcuts",
    intellij: {
      mac: k("/", { meta: true, shift: true }),
      win: k("/", { ctrl: true, shift: true }),
    },
    vscode: {
      mac: k("/", { meta: true, shift: true }),
      win: k("/", { ctrl: true, shift: true }),
    },
  },
  {
    id: "ascii",
    action: "Open ASCII codes",
    intellij: {
      mac: k("1", { meta: true, shift: true }),
      win: k("1", { ctrl: true, shift: true }),
    },
    vscode: {
      mac: k("1", { meta: true, shift: true }),
      win: k("1", { ctrl: true, shift: true }),
    },
  },
  {
    id: "convert",
    action: "Open number converter",
    intellij: {
      mac: k("2", { meta: true, shift: true }),
      win: k("2", { ctrl: true, shift: true }),
    },
    vscode: {
      mac: k("2", { meta: true, shift: true }),
      win: k("2", { ctrl: true, shift: true }),
    },
  },
  {
    id: "formatDocument",
    action: "Format document",
    intellij: {
      mac: k("f", { meta: true, alt: true }),
      win: k("f", { ctrl: true, alt: true }),
    },
    vscode: {
      mac: k("f", { shift: true, alt: true }),
      win: k("f", { shift: true, alt: true }),
    },
  },
  {
    id: "formatSelection",
    action: "Format selection",
    intellij: {
      mac: k("f", { meta: true, alt: true, shift: true }),
      win: k("f", { ctrl: true, alt: true, shift: true }),
    },
    vscode: {
      mac: k("f", { meta: true, shift: true }),
      win: k("f", { ctrl: true, shift: true }),
    },
  },
  {
    id: "undo",
    action: "Undo",
    intellij: { mac: k("z", { meta: true }), win: k("z", { ctrl: true }) },
    vscode: { mac: k("z", { meta: true }), win: k("z", { ctrl: true }) },
  },
  {
    id: "redo",
    action: "Redo",
    intellij: {
      mac: k("z", { meta: true, shift: true }),
      win: k("z", { ctrl: true, shift: true }),
    },
    vscode: {
      mac: k("z", { meta: true, shift: true }),
      win: k("y", { ctrl: true }),
    },
  },
  {
    id: "indent",
    action: "Indent",
    displayOnly: true,
    intellij: { mac: k("Tab"), win: k("Tab") },
    vscode: { mac: k("Tab"), win: k("Tab") },
  },
  {
    id: "outdent",
    action: "Outdent",
    displayOnly: true,
    intellij: { mac: k("Tab", { shift: true }), win: k("Tab", { shift: true }) },
    vscode: { mac: k("Tab", { shift: true }), win: k("Tab", { shift: true }) },
  },
  {
    id: "duplicateLine",
    action: "Duplicate line(s)",
    intellij: {
      mac: k("d", { meta: true }),
      win: k("d", { ctrl: true }),
    },
    vscode: {
      mac: k("ArrowDown", { shift: true, alt: true }),
      win: k("ArrowDown", { shift: true, alt: true }),
    },
  },
  {
    id: "moveLineUp",
    action: "Move line(s) up",
    intellij: {
      mac: k("ArrowUp", { shift: true, meta: true }),
      win: k("ArrowUp", { shift: true, alt: true }),
    },
    vscode: {
      mac: k("ArrowUp", { alt: true }),
      win: k("ArrowUp", { alt: true }),
    },
  },
  {
    id: "moveLineDown",
    action: "Move line(s) down",
    intellij: {
      mac: k("ArrowDown", { shift: true, meta: true }),
      win: k("ArrowDown", { shift: true, alt: true }),
    },
    vscode: {
      mac: k("ArrowDown", { alt: true }),
      win: k("ArrowDown", { alt: true }),
    },
  },
  {
    id: "deleteLine",
    action: "Delete line(s)",
    intellij: {
      mac: k("k", { meta: true, shift: true }),
      win: k("k", { ctrl: true, shift: true }),
    },
    vscode: {
      mac: k("k", { meta: true, shift: true }),
      win: k("k", { ctrl: true, shift: true }),
    },
  },
  {
    id: "toggleComment",
    action: "Toggle line comment",
    intellij: {
      mac: k("/", { meta: true }),
      win: k("/", { ctrl: true }),
    },
    vscode: {
      mac: k("/", { meta: true }),
      win: k("/", { ctrl: true }),
    },
  },
];

export function detectIsMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function loadScheme(): ShortcutScheme {
  if (typeof window === "undefined") return "intellij";
  const v = localStorage.getItem(SCHEME_KEY);
  return v === "vscode" ? "vscode" : "intellij";
}

export function loadOsView(): OsView {
  if (typeof window === "undefined") return "auto";
  const v = localStorage.getItem(OS_VIEW_KEY);
  if (v === "mac" || v === "windows" || v === "both" || v === "auto") return v;
  return "auto";
}

export type OverrideMap = Partial<
  Record<ShortcutId, { mac?: Chord; win?: Chord }>
>;

export function loadOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OverrideMap;
  } catch {
    return {};
  }
}

export function saveOverrides(map: OverrideMap): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
}

export function resolveOsView(view: OsView): "mac" | "windows" | "both" {
  if (view === "both") return "both";
  if (view === "mac") return "mac";
  if (view === "windows") return "windows";
  return detectIsMac() ? "mac" : "windows";
}

export function getEffectiveChord(
  def: ShortcutDef,
  scheme: ShortcutScheme,
  os: "mac" | "windows",
  overrides: OverrideMap,
): Chord {
  const ovKey = os === "mac" ? "mac" : "win";
  const ov = overrides[def.id]?.[ovKey];
  if (ov) return ov;
  return def[scheme][ovKey];
}

function keyLabel(key: string, os: "mac" | "windows"): string {
  const map: Record<string, string> = {
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Backspace: os === "mac" ? "Delete" : "Backspace",
    " ": "Space",
  };
  if (map[key]) return map[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/** Pretty-print a chord for Mac or Windows. */
export function formatChord(chord: Chord, os: "mac" | "windows"): string {
  const parts: string[] = [];
  if (os === "mac") {
    if (chord.ctrl) parts.push("Ctrl");
    if (chord.alt) parts.push("⌥");
    if (chord.shift) parts.push("⇧");
    if (chord.meta) parts.push("⌘");
  } else {
    if (chord.ctrl) parts.push("Ctrl");
    if (chord.alt) parts.push("Alt");
    if (chord.shift) parts.push("Shift");
    if (chord.meta) parts.push("Win");
  }
  parts.push(keyLabel(chord.key, os));
  return parts.join(os === "mac" ? "" : "+");
}

export function formatChordBoth(mac: Chord, win: Chord): string {
  const m = formatChord(mac, "mac");
  const w = formatChord(win, "windows");
  if (m === w) return m;
  return `${w} / ${m}`;
}

export function chordFromEvent(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): Chord {
  return {
    key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
    ctrl: e.ctrlKey || undefined,
    meta: e.metaKey || undefined,
    alt: e.altKey || undefined,
    shift: e.shiftKey || undefined,
  };
}

export function chordsEqual(a: Chord, b: Chord): boolean {
  const norm = (c: Chord) => ({
    key: c.key.length === 1 ? c.key.toLowerCase() : c.key,
    ctrl: !!c.ctrl,
    meta: !!c.meta,
    alt: !!c.alt,
    shift: !!c.shift,
  });
  const x = norm(a);
  const y = norm(b);
  return (
    x.key === y.key &&
    x.ctrl === y.ctrl &&
    x.meta === y.meta &&
    x.alt === y.alt &&
    x.shift === y.shift
  );
}

export function eventMatchesChord(
  e: {
    key: string;
    code?: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  },
  chord: Chord,
): boolean {
  const wantKey =
    chord.key.length === 1 ? chord.key.toLowerCase() : chord.key;
  let key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Shift+digit: browsers report "!" for Shift+1 — use physical code
  if (e.shiftKey && e.code && /^Digit\d$/.test(e.code)) {
    key = e.code.slice(-1);
  }
  if (e.shiftKey && e.code && /^Key[A-Z]$/.test(e.code) && wantKey.length === 1) {
    key = e.code.slice(-1).toLowerCase();
  }
  if (key !== wantKey) return false;
  if (!!chord.alt !== e.altKey) return false;
  if (!!chord.shift !== e.shiftKey) return false;

  const wantCtrl = !!chord.ctrl;
  const wantMeta = !!chord.meta;
  if (wantCtrl || wantMeta) {
    if (!(e.ctrlKey || e.metaKey)) return false;
  } else if (e.ctrlKey || e.metaKey) {
    return false;
  }
  return true;
}

export function matchShortcut(
  e: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
  },
  id: ShortcutId,
  scheme: ShortcutScheme,
  overrides: OverrideMap,
): boolean {
  const def = SHORTCUT_DEFS.find((d) => d.id === id);
  if (!def || def.displayOnly) return false;
  const mac = getEffectiveChord(def, scheme, "mac", overrides);
  const win = getEffectiveChord(def, scheme, "windows", overrides);
  return eventMatchesChord(e, mac) || eventMatchesChord(e, win);
}
