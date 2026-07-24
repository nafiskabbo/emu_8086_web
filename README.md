# emu8086web

Browser-based 8086 assembler and step debugger. A modernization of classic emu8086 for every platform — write, assemble, and debug MASM-style assembly entirely in your browser.

**Developed by [Nafis Islam Kabbo](https://github.com/nafiskabbo)** · Version **1.1.0** · [MIT License](LICENSE) · [Changelog](CHANGELOG.md)

![emu8086web logo](public/logo.svg)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the IDE opens directly.

## Features

- Multi-file workspace (tabs, open multiple `.asm` files, named Save / Save as)
- Compile, Run, Pause, Step, Reset with breakpoints
- Registers, flags (with Details view), data segment, hex memory dump, stack & call stack
- CRT console with DOS INT 21h / BIOS INT 10h / INT 16h I/O
- Broad 8086 instruction coverage (interpretive engine)
- Shareable program links, autosave, light/dark themes, accent color
- Editor: indent-on-Enter, format document, tab size / word wrap
- Help tools: ASCII table, number converter, shortcuts, changelog, About
- Copy error for AI assistants from the error bar
- Resizable editor / console / CPU panels; responsive mobile & desktop layout
- Settings modal (theme, UI scale, editor prefs, accent)
- Vercel Analytics; manual AdSense placements (Help / Settings / Call stack / bottom anchor)

## Using the IDE

1. Write assembly or load a sample.
2. **Compile** (F5), then **Step** (F8) or **Run**.
3. Click gutter line numbers for breakpoints.
4. Use **+** on the tab bar for new files; double-click a tab to rename.
5. **Save** / **Save as** downloads the active file by name.
6. **Help** → ASCII codes, converters, About, Settings (modal).
7. Copy source from the button next to the file name in the Source panel.

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
app/                  Next.js routes (/ IDE)
components/ide/       Editor, panels, toolbar, help, settings modal
lib/emulator/         Assembler + CPU interpreter
lib/ide/              Workspace + emulator React hook
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

This is an **open source** project. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- No backend — emulator runs in the browser

## Inspired by emu8086

A modern web reimagining of the classic [emu8086](https://emu8086-microprocessor-emulator.en.softonic.com/) teaching tool. Not affiliated with the original software.

## License

[MIT](LICENSE) © Nafis Islam Kabbo
