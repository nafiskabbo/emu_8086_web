import type { DosContext, DosHandlerResult } from "./types";

/** Handle DOS INT 21h and BIOS INT 10h console services. */
export function handleInterrupt(
  vector: number,
  ctx: DosContext,
): DosHandlerResult {
  if (vector === 0x21) return handleInt21(ctx);
  if (vector === 0x10) return handleInt10(ctx);
  return { handled: false };
}

function handleInt21(ctx: DosContext): DosHandlerResult {
  const ah = ctx.get8("ah");

  switch (ah) {
    case 0x01:
    case 0x08: {
      const ch = ctx.readInputChar();
      if (ch === null) {
        ctx.waitingForInput = true;
        return { handled: true, waitForInput: true };
      }
      ctx.set8("al", ch.charCodeAt(0));
      ctx.print(ch === "\r" ? "\n" : ch);
      return { handled: true };
    }
    case 0x02: {
      const dl = ctx.get8("dl");
      ctx.print(String.fromCharCode(dl).replace(/\r/, "\n"));
      return { handled: true };
    }
    case 0x09: {
      let addr = ctx.reg.dx;
      let s = "";
      while (ctx.mem[addr] !== 36 && s.length < 10_000) {
        s += String.fromCharCode(ctx.mem[addr]);
        addr++;
      }
      ctx.print(s.replace(/\r\n|\r/g, "\n"));
      return { handled: true };
    }
    case 0x0a: {
      const bufferAddr = ctx.reg.dx;
      const maxLen = ctx.mem[bufferAddr];
      let count = 0;
      while (count < maxLen) {
        const ch = ctx.readInputChar();
        if (ch === null) {
          ctx.waitingForInput = true;
          return { handled: true, waitForInput: true };
        }
        if (ch === "\r" || ch === "\n") break;
        ctx.mem[bufferAddr + 2 + count] = ch.charCodeAt(0);
        ctx.print(ch);
        count++;
      }
      ctx.mem[bufferAddr + 1] = count;
      ctx.print("\n");
      return { handled: true };
    }
    case 0x4c:
      return { handled: true, halt: true };
    default:
      return { handled: false };
  }
}

function handleInt10(ctx: DosContext): DosHandlerResult {
  const ah = ctx.get8("ah");
  if (ah === 0x0e) {
    const al = ctx.get8("al");
    ctx.print(String.fromCharCode(al).replace(/\r/, "\n"));
    return { handled: true };
  }
  return { handled: false };
}
