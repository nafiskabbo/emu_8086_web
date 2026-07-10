# Emulator engine reference

The interpretive 8086 engine lives in `lib/emulator/`. It is framework-agnostic TypeScript with no React dependencies.

## Public API

```typescript
import { assemble, createMachine, SAMPLES } from "@/lib/emulator";

const program = assemble(source);
const machine = createMachine(program);

while (!machine.halted) {
  machine.step();
}

console.log(machine.output);
```

### Key modules

| Module | Purpose |
|--------|---------|
| `assemble.ts` | Two-pass MASM-style parser → `AssembledProgram` |
| `machine.ts` | `Machine` class — register file, flags, step execution |
| `dos.ts` | INT 21h / INT 10h handler dispatch |
| `flags.ts` | Flag arithmetic after ALU operations |
| `utils.ts` | Number parsing, hex formatting, share encoding |
| `samples.ts` | Built-in example programs |

## Memory model

- 64 KiB flat `Uint8Array`
- Data variables allocated from offset 0 upward
- Code is an instruction array (not placed in memory as opcodes)
- `@data` and `offset label` resolve to data addresses
- Stack uses `SP` starting at `0xFFFE`, grows downward

## Supported instructions

### Data transfer
`mov`, `xchg`, `lea`, `push`, `pop`, `pushf`, `popf`

### Arithmetic
`add`, `sub`, `inc`, `dec`, `mul`, `imul`, `div`, `neg`, `cmp`, `test`

### Logic
`and`, `or`, `xor`, `not`, `shl`, `shr`

### Control flow
`jmp`, `je`/`jz`, `jne`/`jnz`, `jg`/`jnle`, `jge`/`jnl`, `jl`/`jnge`, `jle`/`jng`, `ja`/`jnbe`, `jae`/`jnb`/`jnc`, `jb`/`jnae`/`jc`, `jbe`/`jna`, `loop`, `loope`/`loopz`, `loopne`/`loopnz`, `call`, `ret`

### String (with optional REP prefix)
`movsb`, `movsw`, `stosb`, `stosw`, `lodsb`, `lodsw`

### Other
`nop`, `int`, `cbw`, `cwd`, `clc`, `stc`, `cmc`, `cld`, `std`, `lahf`, `sahf`

## Supported interrupts

### INT 21h (DOS)

| AH | Function |
|----|----------|
| 01 | Read character with echo |
| 02 | Write character (`DL`) |
| 08 | Read character without echo |
| 09 | Write string (`DS:DX`, `$`-terminated) |
| 0Ah | Buffered keyboard input |
| 4Ch | Exit program |

### INT 10h (BIOS)

| AH | Function |
|----|----------|
| 0Eh | Teletype output (`AL`) |

## Extending the engine

### Adding an instruction

1. Add parsing support in `assemble.ts` if the syntax is new.
2. Add a `case` in `Machine.executeInstruction()` in `machine.ts`.
3. Update this matrix and add a sample program if useful.

### Adding an interrupt

1. Add handler logic in `dos.ts` (or a new module for non-DOS vectors).
2. Wire through `handleInterrupt()` in `machine.ts` `int` case.

## Error handling

- `AsmError` carries an optional `line` number for assembly errors.
- Runtime errors set `machine.err` and halt execution.
- Instruction limit (2M steps) catches infinite loops during Run.

## Share encoding

Programs are base64-encoded in the `?p=` query parameter:

```typescript
import { encodeProgramToShare, decodeProgramFromShare } from "@/lib/emulator";
```

Keep shared programs under ~8 KB for practical URL lengths.
