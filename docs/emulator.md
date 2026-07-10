# Emulator engine reference

The interpretive 8086 engine lives in `lib/emulator/`. Framework-agnostic TypeScript — no React.

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

## Memory model

- 64 KiB flat `Uint8Array`
- Data variables from offset 0
- Code is an instruction array (not machine opcodes in memory)
- `@data` / `offset label` resolve to data addresses
- Stack: `SP` starts at `0xFFFE`, grows downward

## Instructions (v1.0)

### Data transfer
`mov`, `xchg`, `lea`, `lds`, `les`, `push`, `pop`, `pushf`, `popf`, `xlat`/`xlatb`, `in`, `out` (stub)

### Arithmetic
`add`, `adc`, `sub`, `sbb`, `inc`, `dec`, `mul`, `imul`, `div`, `idiv`, `neg`, `cmp`, `test`, `aaa`, `aas`, `daa`, `das`, `aam`, `aad`, `cbw`, `cwd`

### Logic / shift
`and`, `or`, `xor`, `not`, `shl`/`sal`, `shr`, `sar`, `rol`, `ror`, `rcl`, `rcr`

### Control flow
`jmp`, `je`/`jz`, `jne`/`jnz`, `jg`/`jnle`, `jge`/`jnl`, `jl`/`jnge`, `jle`/`jng`, `ja`/`jnbe`, `jae`/`jnb`/`jnc`, `jb`/`jnae`/`jc`, `jbe`/`jna`, `js`, `jns`, `jo`, `jno`, `jp`/`jpe`, `jnp`/`jpo`, `jcxz`, `loop`, `loope`/`loopz`, `loopne`/`loopnz`, `call`, `ret`, `iret`

### String (optional `rep` / `repe` / `repne`)
`movsb`, `movsw`, `stosb`, `stosw`, `lodsb`, `lodsw`, `cmpsb`, `cmpsw`, `scasb`, `scasw`

### Flags / system
`clc`, `stc`, `cmc`, `cld`, `std`, `cli`, `sti`, `lahf`, `sahf`, `nop`, `hlt`, `wait`, `lock`, `int`, `into`

## Interrupts

### INT 21h (DOS)

| AH | Function |
|----|----------|
| 00 / 4Ch | Terminate |
| 01 | Read char + echo |
| 02 | Write char (`DL`) |
| 05 | Printer (→ console) |
| 06 | Direct console I/O |
| 07 / 08 | Read char (no echo) |
| 09 | Write `$`-terminated string |
| 0Ah | Buffered input |
| 0Bh | Input status |
| 0Ch | Flush + input |
| 25h / 35h | Set/get vector (stub) |
| 2Ah / 2Ch | Date / time |
| 30h | DOS version |
| 3Fh / 40h | Read / write handle (stdin/stdout) |

### INT 10h (BIOS video — text)

| AH | Function |
|----|----------|
| 00 | Set mode (stub) |
| 02 / 03 | Cursor (stub) |
| 06 / 07 | Scroll |
| 09 / 0A | Write char |
| 0Eh | Teletype |
| 13h | Write string |

### INT 16h (keyboard)

| AH | Function |
|----|----------|
| 00 / 10h | Read key |
| 01 / 11h | Check key |

### INT 20h
Program terminate.

## Extending

1. Add a `case` in `Machine.executeInstruction()` (`machine.ts`)
2. For DOS/BIOS, extend `dos.ts`
3. Update this matrix
4. Add a sample in `samples.ts` when useful

## Errors

- `AsmError` may include a source `line`
- Runtime errors set `machine.err` (includes `(line N)`) and halt
- Instruction limit (2M) stops infinite Run loops

## Share encoding

```typescript
import { encodeProgramToShare, decodeProgramFromShare } from "@/lib/emulator";
```

Programs are base64-encoded in `?p=` query params.
