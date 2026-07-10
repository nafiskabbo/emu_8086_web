# Contributing to emu8086web

Thanks for helping modernize 8086 assembly education for the browser.

## Development setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the IDE loads at `/`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |
| `npm run verify` | lint + typecheck + build |

## Project layout

- `lib/emulator/` — pure TypeScript assembler + interpreter (no React)
- `lib/ide/` — React hooks and workspace helpers
- `components/ide/` — IDE UI
- `app/` — Next.js routes (`/` IDE, `/settings`)
- `docs/emulator.md` — instruction / interrupt matrix

## How to contribute

1. Fork the repository and create a feature branch.
2. Prefer small, focused PRs (one concern each).
3. Keep emulator logic in `lib/emulator/` — UI must not reimplement CPU rules.
4. When adding an instruction or interrupt, update `docs/emulator.md`.
5. Run `npm run verify` before opening a PR.
6. Describe the **why** in the PR body and include a short test plan.

## Coding guidelines

- TypeScript strict mode; avoid `any`
- Named exports by default
- Client components only when browser APIs / state are required
- Match existing CRT/PCB visual tokens in `app/globals.css`

## Reporting bugs

Include:

- Browser and OS
- Minimal `.asm` repro
- Expected vs actual behavior
- Console / runtime error text if any

## Code of conduct

Be respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

By contributing, you agree your contributions are licensed under the MIT License.
