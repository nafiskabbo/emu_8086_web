# Changelog

All notable changes to emu8086web are documented in this file.

## [1.3.0] — 2026-09-23

### Added

- Offline macOS desktop build via Electron (`electron/main.js` + `preload.js`): the packaged app forks the bundled Next standalone server on loopback, so assembling, running, stepping, and file save work with no internet
- One-command local builds: `bun run dist:mac` (current Apple-silicon/Intel arch) and `bun run electron:dist:mac-all` (arm64 + x64 DMGs); `bun run electron:dev` for live desktop development
- Offline helpers (`lib/electron/offline.ts`) with unit tests: Electron detection, loopback URL/health-check builders, port normalization, share gating
- Share dialog goes offline-aware: the Generate action disables with guidance while offline instead of failing on a network error
- Ads feature flag (`NEXT_PUBLIC_ENABLE_ADS`, default OFF): all AdSense units, the anchor bar, and the ads script/meta render only when enabled — no empty ad boxes on web or desktop
- Native desktop menu: emu8086web app menu (About, Check for Updates), File (New/Open/Save/Save As), Assemble (Compile/Run/Pause/Step/Reset), standard Edit roles, View zoom/reload, Window, and Help (shortcuts, ASCII, converter, issue tracker) wired into the IDE
- Branded macOS app icon (`assets/icon.icns`, generated from `public/logo.svg`)
- In-app auto-update (electron-updater + GitHub Releases): background check after launch, restart prompt when ready, manual “Check for Updates…” in the menu
- `release-desktop` GitHub workflow: push a `v*` tag to build arm64 + x64 DMGs and attach them to the release for the updater

### Fixed

- Electron dev shell on macOS: allow loopback dev origins (HMR + client chunks load, clicks work) and launch dev Electron with `--no-sandbox` (sandboxed dev Helper file access is denied); packaged builds stay sandboxed

### Notes

- Seamless auto-install on macOS needs Developer ID signing + notarization; until then the updater downloads and the user reinstalls from the DMG

## [1.2.6] — 2026-09-23

### Fixed

- Memory operands with uppercase registers (`[SI]`, `[SI+2]`, `ARR[SI]`, `[BX+SI]`, `MARK[BX][SI]`) now resolve correctly — previously only lowercase worked, which returned wrong data whenever the target was not at offset 0
- String search over memory with an uppercase index register no longer misses or loops past the terminator

### Added

- Regression suite (`lib/emulator/addressing-modes.test.ts`): uppercase memory operands plus case-insensitivity coverage for opcodes, registers, directives, hex/binary suffixes, `DUP`, `OFFSET`/`LEA`, `BYTE/WORD PTR`, and quoted-semicolon strings

## [1.2.5] — 2026-09-09

### Added

- Assembler/emulator supports MASM-style 2D array indexing: `mark[bx][si]` (equivalent to `mark[bx+si]`)

## [1.2.4] — 2026-09-08

### Fixed

- Assembler accepts continuation `db` / `dw` lines without a label (MASM-style multi-line arrays, e.g. 2D byte matrices)

## [1.2.3] — 2026-09-07

### Fixed

- `mov [si], bl` / `mov al, [si]` are byte operations when one operand is an 8-bit register (bare `[si]` was treated as a word, which zeroed the next array element during bubble sort)
- INT 21h AH=01 echoes Enter as CR (`0Dh`) — cursor to column 0 — instead of a line feed, so a following `newline` proc is a single new line
- Run no longer stops at each character of INT 21h input; type a full number and press Enter without clicking Run again

### Added

- Sample programs: define an array, print an array, sort an array
- Console keyboard accepts a line / paste; Enter sends CR as the end-of-input character

### Changed

- Package manager is **Bun** (`bun.lock`, `bun install` / `bun run …`). `package-lock.json` is gone.

## [1.2.2] — 2026-08-01

### Fixed

- DOS console treats `0Ah` (LF) and `0Dh` (CR) as independent cursor motions (LF = down, keep column; CR = column 0) — matching emu8086 / DOS, including overwrite and stair-step LF-only cases
- ASCII codes info popover no longer clips off-screen at the bottom of a column

### Added

- IBM PC Code Page 437 glyph mapping for console output (classic DOS symbols through 255)
- ASCII codes Help panel: full 0–255 map, viewport-fit columns (32 / 16 / 10 rows), horizontal scroll
- Per-code info card (hover): glyph, abbrev badge, short description — fixed-position so it stays visible
- Unit tests for CR/LF cursor semantics, triangle sample, and CP437 glyphs (`npm test`)

### Changed

- Number converter ASCII row reports CP437 through 255

## [1.2.1] — 2026-07-24

### Added

- Open-source repo link (`github.com/nafiskabbo/emu_8086_web`) with GitHub icon in About, Settings, and contact links
- Help menu shows preference-aware shortcut chords beside ASCII / converter / shortcuts
- Assembly-themed custom 404 page
- Google Search Console verification meta tag
- Copy icon beside Copy / Copy error labels (console + error bar)

### Changed

- Migrated Next.js `middleware` → `proxy` convention
- README logo sized down; contributing points at the GitHub repo

## [1.2.0] — 2026-07-24

### Added

- Share dialog: expiry 1 / 3 / 7 days, short `/s/{code}` URL, QR code, copy link (Supabase-backed)
- Anonymous Share API (`POST /api/share`, `GET /api/share/{code}`) with size limits, dedup, rate limit, and expired-row cleanup
- Editor paneltitle: Undo / Redo / Copy icon buttons
- Agent & SEO discoverability: absolute sitemap, robots Content-Signal (`ai-train=yes, search=yes, ai-input=yes`), Link headers, Markdown-for-Agents on `/`, API catalog, health endpoint, agent-skills index, WebMCP tools, JSON-LD (author + product + portfolio sites)

### Notes

- Run the `shared_programs` SQL from the 1.2.0 release plan in the Supabase SQL editor; set `SUPABASE_SERVICE_ROLE_KEY` (never expose it as `NEXT_PUBLIC_`)
- Optional DNS-AID SVCB records for agent discovery must be configured in your DNS provider (e.g. Cloudflare) — not shipped as app code
- Legacy `?p=` share links still load

## [1.1.1] — 2026-07-24

### Added

- `ads.txt` at site root (`google.com, pub-4805854422784600, DIRECT, f08c47fec0942fa0`)
- Site ready for Google Funding Choices CMP (served by existing AdSense tag once published in AdSense Privacy & messaging)

## [1.1.0] — 2026-07-24

### Added

- Editor indent-on-Enter and Format Document / Format Selection (scheme-aware)
- Keyboard shortcuts Help: IntelliJ (default) / VS Code schemes; Auto / Mac / Windows / Both display; remappable chords
- Multi-line editing: duplicate / move / delete lines, toggle comment; custom undo/redo stack
- F5 / F8 work while the editor is focused; Esc closes dialogs
- Help → Changelog panel
- Copy error for AI (error bar) with numbered source context
- Flags register Details dialog (meanings + FLAGS word)
- Settings: tab size, word wrap, primary accent color (auto-contrast button text)
- About / Settings contact links (portfolio, GitHub, LinkedIn, WhatsApp, email)
- Manual AdSense display units (hidden when unfilled); bottom anchor collapses when empty
- Hotkeys: ASCII (`Mod+Shift+1`), Number converter (`Mod+Shift+2`), Shortcuts (`Mod+Shift+/`)

### Fixed

- Assembler accepts double-quoted strings in `DB` / `DW` (e.g. `str1 db "Fail$"`)
- Clearer `Bad value` messages for invalid data tokens
- Undo/redo after controlled editor updates
- Mac-friendly shortcut labels (⌘ ⌥ ⇧) instead of Alt-only chords

## [1.0.0] — 2026-07-01

### Added

- Initial release: MASM-style assemble, step, run, multi-file workspace
- Registers, flags, memory dump, console I/O, breakpoints, share links
