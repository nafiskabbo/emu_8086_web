# emu8086web

A browser-based 8086 microprocessor assembler and step debugger — inspired by the classic emu8086 Windows application, rebuilt for the web.

## Goals

- Teach 8086 assembly in classrooms without requiring a Windows install
- Mirror the familiar emu8086 workflow: write source, compile, step/run, inspect registers and memory
- Run entirely client-side — no server, no accounts, no setup beyond a browser

## Audience

- Computer architecture and assembly language students
- Instructors who previously relied on emu8086 for lab assignments
- Self-learners exploring x86 fundamentals

## Feature matrix

| Feature | Classic emu8086 | emu8086web MVP | Planned |
|---------|-----------------|----------------|---------|
| MASM-style `.asm` source | Yes | Yes | — |
| Compile / Assemble | Yes | Yes | — |
| Step / Run / Reset | Yes | Yes | — |
| Registers & flags view | Yes | Yes | — |
| Data segment variables | Yes | Yes | — |
| Stack view | Yes | Yes | Call stack added |
| Console I/O (INT 21h) | Yes | Partial (AH=1,2,8,9,0Ah,4Ch) | Full DOS subset |
| BIOS teletype (INT 10h) | Yes | AH=0Eh | Graphics modes |
| Breakpoints | Yes | Yes | — |
| Memory hex dump | Yes | Yes | — |
| File open/save | Yes | Yes (.asm) | — |
| Share program link | No | Yes | — |
| Autosave session | No | Yes | — |
| Virtual I/O devices | Yes | No | Roadmap |
| Binary `.com` export | Yes | No | Roadmap |
| Full instruction set | Yes | Classroom subset | Expand incrementally |
| Tutorials app | Yes | No | Roadmap |

## Architecture

```
app/                    Next.js routes (landing + IDE)
components/ide/         Debugger UI (client components)
lib/emulator/           Pure TypeScript assembler + interpreter
lib/ide/                React hook bridging UI ↔ engine
public/logo.svg         Brand mark
```

The emulator is **interpretive**: source is parsed into an instruction list and executed directly. This matches classroom usage and keeps the engine approachable. It does not emit real 8086 machine code.

### Flat memory model

Data variables live at offsets starting at 0. Segment registers (`DS`, `ES`, etc.) are displayed but the teaching model treats memory as flat — `@data` resolves to 0. Document this when porting programs that rely on segmented addressing.

## Non-goals (MVP)

- Cycle-accurate or binary-faithful emulation
- Running arbitrary `.com` / `.exe` files from disk
- Multi-file projects or cloud sync
- Graphics modes, mouse, virtual hardware labs

## Roadmap

1. **Phase 2** — More instructions and addressing modes; INT 10h text modes
2. **Phase 3** — Virtual I/O devices (LED, 7-segment, stepper)
3. **Phase 4** — Optional binary encoding layer for advanced labs
4. **Phase 5** — Embedded tutorial content

## Legacy reference

[`emu8086web.html`](emu8086web.html) is the original single-file prototype. The Next.js app supersedes it; the HTML file is kept for reference.
