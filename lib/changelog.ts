/** Structured release notes for Help → Changelog (mirrors CHANGELOG.md). */

export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.1",
    date: "2026-07-24",
    highlights: [
      "ads.txt at site root for AdSense authorization",
      "Google CMP consent messaging ready via existing AdSense tag (EEA/UK/CH)",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-07-24",
    highlights: [
      "Assembler accepts double-quoted strings in DB/DW (e.g. db \"Fail$\")",
      "Editor: indent-on-Enter, format document/selection, multi-line edit, undo/redo",
      "Shortcuts: IntelliJ/VS Code schemes, Mac/Windows/Both views, remappable chords",
      "Hotkeys for ASCII (Mod+Shift+1) and Number converter (Mod+Shift+2)",
      "Copy error for AI — source context ready to paste into ChatGPT / Gemini",
      "Help → Changelog; version bumped to 1.1.0",
      "Flags register Details dialog (meanings + FLAGS word)",
      "Settings: tab size, word wrap, primary accent with contrast-safe button text",
      "About / Settings: portfolio, GitHub, LinkedIn, WhatsApp, email",
      "Manual AdSense banners (hide when unfilled) + bottom anchor",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-01",
    highlights: [
      "Initial release: MASM-style assemble, step, run, multi-file workspace",
      "Registers, flags, memory dump, console I/O, breakpoints, share links",
    ],
  },
];
