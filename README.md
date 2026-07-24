# emu8086web

Browser-based 8086 assembler and step debugger. A modernization of classic emu8086 for every platform — write, assemble, and debug MASM-style assembly entirely in your browser.

**Developed by [Nafis Islam Kabbo](https://nafiskabbo.vercel.app/)** · Version **1.2.1** · [MIT License](LICENSE) · [Changelog](CHANGELOG.md)

- Product: [https://emu-8086-web.vercel.app](https://emu-8086-web.vercel.app)
- Portfolio: [https://nafiskabbo.vercel.app](https://nafiskabbo.vercel.app)
- Source: [https://github.com/nafiskabbo/emu_8086_web](https://github.com/nafiskabbo/emu_8086_web)

<img src="public/logo.svg" alt="emu8086web logo" width="72" height="72" />

## Quick start

```bash
npm install
cp .env.example .env.local   # fill Supabase keys for share links
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the IDE opens directly.

### Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (sitemap, share links) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (optional for future client use) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — Share API (never commit / never `NEXT_PUBLIC_`) |

Run the `shared_programs` SQL from the 1.2.0 release notes / plan in the Supabase SQL editor (RLS on, service role only, hourly cleanup cron).

## Features

- Multi-file workspace (tabs, open multiple `.asm` files, named Save / Save as)
- Compile, Run, Pause, Step, Reset with breakpoints
- Registers, flags (with Details view), data segment, hex memory dump, stack & call stack
- CRT console with DOS INT 21h / BIOS INT 10h / INT 16h I/O
- Broad 8086 instruction coverage (interpretive engine)
- Short share links (`/s/{code}`) with 1 / 3 / 7 day expiry, QR code, dedup; legacy `?p=` still loads
- Light/dark themes, accent color; Undo / Redo / Copy icons in Source panel
- Editor: indent-on-Enter, format document, tab size / word wrap
- Help tools: ASCII table, number converter, shortcuts, changelog, About
- Copy error for AI assistants from the error bar
- Resizable editor / console / CPU panels; responsive mobile & desktop layout
- Agent discovery: sitemap, robots Content-Signal, Link headers, Markdown Accept on `/`, API catalog, agent-skills, WebMCP, JSON-LD
- Vercel Analytics; manual AdSense placements; `ads.txt` + Google CMP for EEA/UK/CH

## Using the IDE

1. Write assembly or load a sample.
2. **Compile** (F5), then **Step** (F8) or **Run**.
3. Click gutter line numbers for breakpoints.
4. Use **+** on the tab bar for new files; double-click a tab to rename.
5. **Save** / **Save as** downloads the active file by name.
6. **Share** opens a dialog — pick expiry, generate short URL + QR.
7. **Help** → ASCII codes, converters, About, Settings (modal).
8. Undo / Redo / Copy icons sit next to the file name in the Source panel.

### Keyboard shortcuts

Defaults follow **IntelliJ** (switchable to VS Code in Help → Shortcuts). Mac shows ⌘/⌥; Windows shows Ctrl/Alt. Remap any chord in that panel.

| Action | IntelliJ (typical) |
|--------|-------------------|
| Compile | F5 |
| Step | F8 |
| Pause / close dialog | Esc |
| Save | ⌘/Ctrl+S |
| Shortcuts help | ⌘/Ctrl+Shift+/ or `?` |
| ASCII codes | ⌘/Ctrl+Shift+1 |
| Number converter | ⌘/Ctrl+Shift+2 |
| Format document | ⌘/Ctrl+⌥/Alt+F |
| Format selection | ⌘/Ctrl+⌥/Alt+Shift+F |
| Undo / Redo | ⌘/Ctrl+Z · ⌘/Ctrl+Shift+Z |

## Agent / SEO discovery

| Resource | Path |
|----------|------|
| Sitemap | `/sitemap.xml` |
| Robots + Content-Signal | `/robots.txt` |
| LLM context | `/llms.txt` |
| API catalog | `/.well-known/api-catalog` |
| Agent skills | `/.well-known/agent-skills/index.json` |
| Health | `/api/health` |
| Markdown for Agents | `Accept: text/markdown` on `/` |

**DNS-AID (optional, DNS provider):** publish SVCB/HTTPS discovery records under `_agents` for your domain pointing at the agent resources above. Sign with DNSSEC when available. This is configured in Cloudflare (or your DNS host), not in this repo.

## Supported assembly

See [docs/emulator.md](docs/emulator.md) for the instruction and interrupt matrix.

## Planned / roadmap

Not yet complete vs classic emu8086 (tracked in [project.md](project.md)):

- Virtual I/O devices (LED, 7-segment, stepper, traffic light)
- INT 10h graphics modes
- Binary opcode encoding / `.com` / `.exe` export
- Embedded tutorials
- Cycle-accurate timing
- Collaborative / cloud projects

## Project structure

```
app/                  Next.js routes (/ IDE, /s/[code], APIs, .well-known)
components/ide/       Editor, panels, toolbar, help, settings, share dialog
lib/emulator/         Assembler + CPU interpreter
lib/ide/              Workspace + emulator React hook
lib/share/            Share limits + rate limit helpers
lib/supabase/         Server Supabase client
docs/emulator.md      Engine reference
```

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run verify     # lint + typecheck + build
```

## Contributing

This is an **open source** project. PRs welcome at [github.com/nafiskabbo/emu_8086_web](https://github.com/nafiskabbo/emu_8086_web). See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Emulator runs in the browser; Share API uses Supabase (optional until configured)

## Inspired by emu8086

A modern web reimagining of the classic [emu8086](https://emu8086-microprocessor-emulator.en.softonic.com/) teaching tool. Not affiliated with the original software.

## License

[MIT](LICENSE) © Nafis Islam Kabbo
