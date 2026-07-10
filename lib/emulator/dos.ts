import type { DosContext, DosHandlerResult } from "./types";

/**
 * DOS INT 21h and BIOS INT 10h / 16h console services.
 * Classroom-oriented full console I/O coverage (text mode).
 */
export function handleInterrupt(
  vector: number,
  ctx: DosContext,
): DosHandlerResult {
  if (vector === 0x21) return handleInt21(ctx);
  if (vector === 0x10) return handleInt10(ctx);
  if (vector === 0x16) return handleInt16(ctx);
  if (vector === 0x20) return { handled: true, halt: true };
  return { handled: false };
}

function handleInt21(ctx: DosContext): DosHandlerResult {
  const ah = ctx.get8("ah");

  switch (ah) {
    case 0x00:
      return { handled: true, halt: true };

    case 0x01: {
      const ch = ctx.readInputChar();
      if (ch === null) {
        ctx.waitingForInput = true;
        return { handled: true, waitForInput: true };
      }
      ctx.set8("al", ch.charCodeAt(0) & 0xff);
      ctx.print(ch === "\r" ? "\n" : ch);
      return { handled: true };
    }

    case 0x02: {
      const dl = ctx.get8("dl");
      ctx.print(String.fromCharCode(dl).replace(/\r/g, "\n"));
      return { handled: true };
    }

    case 0x05: {
      const dl = ctx.get8("dl");
      ctx.print(String.fromCharCode(dl).replace(/\r/g, "\n"));
      return { handled: true };
    }

    case 0x06: {
      const dl = ctx.get8("dl");
      if (dl === 0xff) {
        const ch = ctx.readInputChar();
        if (ch === null) {
          ctx.set8("al", 0);
          return { handled: true };
        }
        ctx.set8("al", ch.charCodeAt(0) & 0xff);
        return { handled: true };
      }
      ctx.print(String.fromCharCode(dl).replace(/\r/g, "\n"));
      return { handled: true };
    }

    case 0x07:
    case 0x08: {
      const ch = ctx.readInputChar();
      if (ch === null) {
        ctx.waitingForInput = true;
        return { handled: true, waitForInput: true };
      }
      ctx.set8("al", ch.charCodeAt(0) & 0xff);
      return { handled: true };
    }

    case 0x09: {
      let addr = ctx.reg.dx & 0xffff;
      let s = "";
      while (ctx.mem[addr] !== 36 && s.length < 10_000) {
        s += String.fromCharCode(ctx.mem[addr]);
        addr = (addr + 1) & 0xffff;
      }
      ctx.print(s.replace(/\r\n|\r/g, "\n"));
      return { handled: true };
    }

    case 0x0a: {
      const bufferAddr = ctx.reg.dx & 0xffff;
      const maxLen = ctx.mem[bufferAddr];
      let count = ctx.mem[bufferAddr + 1] || 0;
      while (count < maxLen) {
        const ch = ctx.readInputChar();
        if (ch === null) {
          ctx.waitingForInput = true;
          ctx.mem[bufferAddr + 1] = count;
          return { handled: true, waitForInput: true };
        }
        if (ch === "\r" || ch === "\n") break;
        if (ch === "\b" && count > 0) {
          count--;
          ctx.print("\b \b");
          continue;
        }
        ctx.mem[(bufferAddr + 2 + count) & 0xffff] = ch.charCodeAt(0) & 0xff;
        ctx.print(ch);
        count++;
      }
      ctx.mem[bufferAddr + 1] = count;
      ctx.print("\n");
      return { handled: true };
    }

    case 0x0b: {
      ctx.set8("al", ctx.peekInputChar() !== null ? 0xff : 0);
      return { handled: true };
    }

    case 0x0c: {
      // Flush buffer then optionally call input function in AL
      const al = ctx.get8("al");
      while (ctx.readInputChar() !== null) {
        /* flush */
      }
      if (al === 0x01 || al === 0x07 || al === 0x08 || al === 0x0a) {
        ctx.set8("ah", al);
        return handleInt21(ctx);
      }
      return { handled: true };
    }

    case 0x25: {
      // Set interrupt vector — stub (flat model)
      return { handled: true };
    }

    case 0x2a: {
      const now = new Date();
      ctx.set8("al", now.getDay());
      ctx.reg.cx = now.getFullYear();
      ctx.set8("dh", now.getMonth() + 1);
      ctx.set8("dl", now.getDate());
      return { handled: true };
    }

    case 0x2c: {
      const now = new Date();
      ctx.set8("ch", now.getHours());
      ctx.set8("cl", now.getMinutes());
      ctx.set8("dh", now.getSeconds());
      ctx.set8("dl", Math.floor(now.getMilliseconds() / 10));
      return { handled: true };
    }

    case 0x30: {
      ctx.set8("al", 5); // DOS 5.0 major
      ctx.set8("ah", 0); // minor
      return { handled: true };
    }

    case 0x35: {
      // Get interrupt vector — stub returns 0
      ctx.reg.es = 0;
      ctx.reg.bx = 0;
      return { handled: true };
    }

    case 0x3f: {
      // Read from handle (stdin = 0)
      const handle = ctx.reg.bx;
      const count = ctx.reg.cx;
      const start = ctx.reg.dx & 0xffff;
      if (handle !== 0) {
        ctx.reg.ax = 0;
        return { handled: true };
      }
      let read = 0;
      let addr = start;
      while (read < count) {
        const ch = ctx.readInputChar();
        if (ch === null) {
          if (read === 0) {
            ctx.waitingForInput = true;
            return { handled: true, waitForInput: true };
          }
          break;
        }
        ctx.mem[addr] = ch.charCodeAt(0) & 0xff;
        addr = (addr + 1) & 0xffff;
        read++;
        if (ch === "\r" || ch === "\n") break;
      }
      ctx.reg.ax = read;
      return { handled: true };
    }

    case 0x40: {
      // Write to handle (stdout/stderr)
      const handle = ctx.reg.bx;
      const count = ctx.reg.cx;
      const addr = ctx.reg.dx & 0xffff;
      if (handle !== 1 && handle !== 2) {
        ctx.reg.ax = 0;
        return { handled: true };
      }
      let s = "";
      for (let i = 0; i < count; i++) {
        s += String.fromCharCode(ctx.mem[(addr + i) & 0xffff]);
      }
      ctx.print(s.replace(/\r\n|\r/g, "\n"));
      ctx.reg.ax = count;
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
  switch (ah) {
    case 0x00:
      // Set video mode — text modes only (no-op for console)
      return { handled: true };
    case 0x02:
    case 0x03:
      // Cursor set/get — stub
      return { handled: true };
    case 0x06:
    case 0x07:
      // Scroll — clear console on full scroll
      if (ctx.get8("al") === 0) ctx.print("\n");
      return { handled: true };
    case 0x09:
    case 0x0a: {
      const al = ctx.get8("al");
      const count = Math.max(1, ctx.reg.cx);
      ctx.print(String.fromCharCode(al).repeat(count).replace(/\r/g, "\n"));
      return { handled: true };
    }
    case 0x0e: {
      const al = ctx.get8("al");
      ctx.print(String.fromCharCode(al).replace(/\r/g, "\n"));
      return { handled: true };
    }
    case 0x13: {
      // Write string ES:BP, CX=length — flat: use BP as offset
      const addr = ctx.reg.bp & 0xffff;
      const len = ctx.reg.cx;
      let s = "";
      for (let i = 0; i < len; i++) {
        s += String.fromCharCode(ctx.mem[(addr + i) & 0xffff]);
      }
      ctx.print(s.replace(/\r\n|\r/g, "\n"));
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

function handleInt16(ctx: DosContext): DosHandlerResult {
  const ah = ctx.get8("ah");
  switch (ah) {
    case 0x00:
    case 0x10: {
      const ch = ctx.readInputChar();
      if (ch === null) {
        ctx.waitingForInput = true;
        return { handled: true, waitForInput: true };
      }
      ctx.set8("al", ch.charCodeAt(0) & 0xff);
      ctx.set8("ah", 0);
      return { handled: true };
    }
    case 0x01:
    case 0x11: {
      // Check keystroke — ZF set if none (approximate via AL)
      const ch = ctx.readInputChar();
      if (ch === null) {
        ctx.set8("al", 0);
      } else {
        ctx.set8("al", ch.charCodeAt(0) & 0xff);
        ctx.set8("ah", 0);
      }
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}
