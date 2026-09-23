/** Structured release notes for Help → Changelog (mirrors CHANGELOG.md). */

export type ChangelogEntry = {
  version: string;
  date: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2026-09-23",
    highlights: [
      "Offline macOS desktop build via Electron (loopback standalone server)",
      "One-command builds: bun run dist:mac; live desktop dev: bun run electron:dev",
      "Share dialog disables gracefully while offline",
      "Ads behind a flag (NEXT_PUBLIC_ENABLE_ADS, default off)",
      "Native desktop menu: File, Assemble, Edit, View, Window, Help",
      "Branded macOS app icon + in-app auto-update from GitHub Releases",
    ],
  },
  {
    version: "1.2.6",
    date: "2026-09-23",
    highlights: [
      "Uppercase memory operands fixed: [SI], [SI+2], ARR[SI], [BX+SI]",
      "Regression tests: uppercase operands + case-insensitivity coverage",
    ],
  },
  {
    version: "1.2.5",
    date: "2026-09-09",
    highlights: [
      "MASM-style 2D array indexing: mark[bx][si] (same effective address as mark[bx+si])",
    ],
  },
  {
    version: "1.2.4",
    date: "2026-09-08",
    highlights: [
      "Assembler accepts continuation DB/DW lines without a label (multi-line 2D byte arrays)",
    ],
  },
  {
    version: "1.2.3",
    date: "2026-09-07",
    highlights: [
      "Byte register + [SI] moves are 8-bit (array sort no longer fills with zeros)",
      "INT 21h AH=01 Enter is CR (0Dh) and does not print an extra newline",
      "Run continues across typed input so a full line can be entered without clicking Run again",
      "Samples: define / print / sort a byte array",
      "Package manager is Bun (bun.lock); npm is no longer used",
    ],
  },
  {
    version: "1.2.2",
    date: "2026-08-01",
    highlights: [
      "DOS console: independent LF (down) and CR (column 0) cursor motion, like emu8086",
      "Console I/O uses IBM PC Code Page 437 glyphs (☺ ☻ box-drawing, etc.)",
      "ASCII codes Help: 0–255 map, viewport-fit columns, fixed info cards",
    ],
  },
  {
    version: "1.2.1",
    date: "2026-07-24",
    highlights: [
      "Open-source GitHub repo link in About / Settings / contacts",
      "Help menu shows shortcut chords from your scheme prefs",
      "Custom 404, Google site verification, copy icons beside Copy labels",
      "Next.js proxy migration (middleware → proxy)",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-24",
    highlights: [
      "Share dialog: 1/3/7 day expiry, short /s/{code} links, QR code (Supabase)",
      "Undo / Redo / Copy icon buttons in the Source panel",
      "Agent-ready SEO: sitemap, Content-Signal, Link headers, Markdown Accept, API catalog, skills index, WebMCP",
      "JSON-LD author + product and portfolio site URLs",
    ],
  },
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
