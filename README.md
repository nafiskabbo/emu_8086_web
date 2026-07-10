# emu8086web

Browser-based 8086 assembler and step debugger. Write MASM-style assembly, compile, and run programs entirely in your browser — no Windows install required.

![emu8086web logo](public/logo.svg)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or go directly to [http://localhost:3000/ide](http://localhost:3000/ide).

## Using the IDE

1. **Write** assembly in the source editor (or load a sample from the dropdown).
2. **Compile** (F5) to assemble the program.
3. **Step** (F8) through instructions one at a time, or **Run** at full speed.
4. Watch **registers**, **flags**, **memory**, and **console output** update live.
5. Click line numbers in the gutter to set **breakpoints**.
6. Use **Open** / **Save** for `.asm` files; your session **autosaves** to localStorage.
7. **Share** copies a URL with your program encoded for assignments.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| F5 | Compile |
| F8 | Single step |
| Esc | Pause |
| ? | Show shortcuts |

## Supported assembly (MVP)

- Directives: `.model`, `.stack`, `.data`, `.code`, `proc`/`endp`, `end`
- Data: `db`, `dw`, `dup`, strings, `?`
- See [docs/emulator.md](docs/emulator.md) for the full instruction and interrupt matrix.

## Project structure

```
app/                  Next.js App Router pages
  page.tsx            Landing page
  ide/page.tsx        Emulator IDE
components/ide/       Editor, panels, toolbar
lib/emulator/         Assembler + CPU interpreter (pure TS)
lib/ide/              useEmulator React hook
docs/emulator.md      Engine reference
project.md            Product vision and roadmap
```

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm run verify     # lint + typecheck + build
```

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- React 19, TypeScript, Tailwind CSS 4
- No backend — emulator runs in the browser

## Inspired by emu8086

This project is a modern web reimagining of the classic [emu8086](http://www.emulator8086.com/) teaching tool. It is not affiliated with the original software.

## License

Private project — see repository owner for terms.
