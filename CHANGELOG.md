# Changelog

All notable changes to emu8086web are documented in this file.

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
