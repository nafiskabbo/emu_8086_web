# emu8086web

A browser-based 8086 microprocessor assembler and step debugger — inspired by the classic emu8086 Windows application, rebuilt for the web by **Nafis Islam Kabbo**.

**Version:** 1.1.1

## Goals

- Teach 8086 assembly without requiring a Windows install
- Mirror the familiar emu8086 workflow on every platform (desktop & mobile browsers)
- Run entirely client-side — no server required for the core IDE

## Audience

- Computer architecture and assembly language students
- Instructors who previously relied on emu8086 for lab assignments
- Open-source contributors expanding instruction / I/O coverage

## Feature matrix

| Feature | Classic emu8086 | emu8086web 1.1 | Planned |
|---------|-----------------|----------------|---------|
| MASM-style `.asm` source | Yes | Yes | — |
| Compile / Step / Run | Yes | Yes | — |
| Multi-file workspace | Limited | Yes | — |
| Named save | Yes | Yes | — |
| Registers & flags | Yes | Yes | — |
| Memory dump | Yes | Yes | — |
| Console I/O (INT 21h/10h/16h) | Yes | Broad text I/O | Graphics |
| Full instruction set | Yes | Broad interpretive set | Gaps filled over time |
| Breakpoints | Yes | Yes | — |
| Share links | No | Yes | — |
| Virtual I/O devices | Yes | No | Roadmap |
| Binary `.com` export | Yes | No | Roadmap |
| Tutorials app | Yes | No | Roadmap |

## Architecture

```
app/                    Next.js routes
components/ide/         Debugger UI
lib/emulator/           Pure TypeScript assembler + interpreter
lib/ide/                Workspace + React bridge
public/                 Logo, favicon, ads.txt, llms.txt, manifest
```

Interpretive engine: source → instruction list → execute. Flat teaching memory model (`@data` → 0).

## Non-goals (for now)

- Cycle-accurate or binary-faithful `.com` execution
- Full VGA graphics / mouse labs
- Cloud accounts

## Roadmap

1. Virtual I/O devices
2. INT 10h graphics modes
3. Optional binary encoding layer
4. Embedded tutorials
5. Fill remaining instruction edge cases from contributor PRs

## License

MIT — see [LICENSE](LICENSE). Contributions welcome via [CONTRIBUTING.md](CONTRIBUTING.md).
