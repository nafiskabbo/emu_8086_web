import { REG8, REG8_TO_REG16, REG16 } from "./constants";
import { AsmError } from "./errors";
import { handleInterrupt } from "./dos";
import {
  createDefaultFlags,
  flagsFromWord,
  flagsToWord,
  setFlagsAfterOp,
  setLogicFlags,
} from "./flags";
import type {
  AssembledProgram,
  Instruction,
  MachineSnapshot,
  Reg16Name,
  Reg8Name,
  Registers,
} from "./types";
import { parseNumber, writeUnit } from "./utils";

/** Interpretive 8086 CPU for classroom assembly programs. */
export class Machine {
  readonly a: AssembledProgram;
  mem: Uint8Array;
  reg: Registers;
  flags = createDefaultFlags();
  ip: number;
  halted = false;
  output = "";
  callStack: number[] = [];
  dataStack: number[] = [];
  steps = 0;
  err: string | null = null;
  inputQueue: string[] = [];
  waitingForInput = false;

  constructor(assembled: AssembledProgram) {
    this.a = assembled;
    this.mem = new Uint8Array(assembled.mem);
    this.reg = {
      ax: 0,
      bx: 0,
      cx: 0,
      dx: 0,
      si: 0,
      di: 0,
      bp: 0,
      sp: 0xfffe,
      ds: 0,
      es: 0,
      ss: 0,
      cs: 0,
    };
    this.ip = assembled.entry;
  }

  get8(regName: Reg8Name): number {
    const fullReg = REG8_TO_REG16[regName];
    const full = this.reg[fullReg];
    return regName[1] === "l" ? full & 0xff : (full >> 8) & 0xff;
  }

  set8(regName: Reg8Name, val: number): void {
    val = val & 0xff;
    const fullReg = REG8_TO_REG16[regName];
    const full = this.reg[fullReg];
    if (regName[1] === "l") {
      this.reg[fullReg] = (full & 0xff00) | val;
    } else {
      this.reg[fullReg] = (full & 0x00ff) | (val << 8);
    }
  }

  isReg8(t: string): t is Reg8Name {
    return (REG8 as readonly string[]).includes(t);
  }

  isReg16(t: string): t is Reg16Name {
    return (REG16 as readonly string[]).includes(t);
  }

  resolveMemOperand(token: string): number | null {
    const t = token.replace(/^(byte|word)\s+ptr\s+/i, "").trim();
    const m = t.match(/^(\w+)?\s*\[\s*([^\]]+)\s*\]$/i);
    if (m) {
      const base = m[1] ? m[1].toLowerCase() : null;
      const offsetExpr = m[2].trim();
      let addr = 0;
      if (base && this.a.dataVars[base]) addr += this.a.dataVars[base].addr;
      const parts = offsetExpr.split("+").map((p) => p.trim());
      for (const p of parts) {
        if (this.isReg16(p)) addr += this.reg[p];
        else {
          const n = parseNumber(p);
          if (n !== null) addr += n;
        }
      }
      return addr;
    }
    const name = t.toLowerCase();
    if (this.a.dataVars[name]) return this.a.dataVars[name].addr;
    return null;
  }

  varUnitSize(token: string): 1 | 2 {
    if (/^byte\s+ptr/i.test(token)) return 1;
    if (/^word\s+ptr/i.test(token)) return 2;
    const t = token.replace(/^(byte|word)\s+ptr\s+/i, "").trim();
    const m = t.match(/^(\w+)/);
    if (m && this.a.dataVars[m[1].toLowerCase()]) {
      return this.a.dataVars[m[1].toLowerCase()].unitSize;
    }
    return 2;
  }

  isMemOperand(token: string): boolean {
    const low = token.toLowerCase();
    return token.includes("[") || this.a.dataVars[low] !== undefined;
  }

  readOperand(token: string): number {
    token = token.trim();
    const low = token.toLowerCase();
    if (this.isReg8(low)) return this.get8(low);
    if (this.isReg16(low)) return this.reg[low];
    if (low === "@data") return 0;
    const num = parseNumber(token);
    if (num !== null) return num;
    if (/^offset\s+/i.test(token)) {
      const name = token.replace(/^offset\s+/i, "").trim().toLowerCase();
      if (this.a.dataVars[name]) return this.a.dataVars[name].addr;
      throw new AsmError(`Unknown symbol "${name}"`);
    }
    if (this.isMemOperand(low)) {
      const addr = this.resolveMemOperand(token);
      if (addr === null) throw new AsmError(`Unknown operand "${token}"`);
      const size = this.varUnitSize(token);
      if (size === 2) return this.mem[addr] | (this.mem[addr + 1] << 8);
      return this.mem[addr];
    }
    throw new AsmError(`Cannot read operand "${token}"`);
  }

  writeOperand(token: string, val: number): void {
    token = token.trim();
    const low = token.toLowerCase();
    if (this.isReg8(low)) {
      this.set8(low, val);
      return;
    }
    if (this.isReg16(low)) {
      this.reg[low] = val & 0xffff;
      return;
    }
    if (this.isMemOperand(low)) {
      const addr = this.resolveMemOperand(token);
      if (addr === null) throw new AsmError(`Unknown operand "${token}"`);
      const size = this.varUnitSize(token);
      writeUnit(this.mem, addr, val, size);
      return;
    }
    throw new AsmError(`Cannot write operand "${token}"`);
  }

  jumpTo(label: string): void {
    label = label.toLowerCase();
    if (this.a.labels[label] === undefined) {
      throw new AsmError(`Unknown label "${label}"`);
    }
    this.ip = this.a.labels[label];
  }

  print(str: string): void {
    this.output += str;
  }

  enqueueInput(char: string): void {
    this.inputQueue.push(char);
    this.waitingForInput = false;
  }

  readInputChar(): string | null {
    return this.inputQueue.length > 0 ? (this.inputQueue.shift() ?? null) : null;
  }

  peekInputChar(): string | null {
    return this.inputQueue.length > 0 ? this.inputQueue[0] : null;
  }

  /** Source line of the last error, if any. */
  getErrorLine(): number | null {
    if (!this.err) return null;
    const m = this.err.match(/\(line\s+(\d+)\)/i);
    return m ? parseInt(m[1], 10) : this.getCurrentLine();
  }

  operandSize(token: string): 1 | 2 {
    return this.isReg8(token.toLowerCase()) ? 1 : 2;
  }

  getCurrentLine(): number | null {
    if (this.halted || this.ip >= this.a.instrs.length) return null;
    return this.a.instrs[this.ip]?.ln ?? null;
  }

  snapshot(): MachineSnapshot {
    return {
      reg: { ...this.reg },
      flags: { ...this.flags },
      ip: this.ip,
      halted: this.halted,
      output: this.output,
      callStack: [...this.callStack],
      dataStack: [...this.dataStack],
      steps: this.steps,
      err: this.err,
      inputQueue: [...this.inputQueue],
      waitingForInput: this.waitingForInput,
    };
  }

  /** Execute one instruction. Returns false when halted or errored. */
  step(): boolean {
    if (this.halted) return false;
    if (this.waitingForInput) return false;
    if (this.ip >= this.a.instrs.length) {
      this.halted = true;
      return false;
    }

    const instr = this.a.instrs[this.ip];
    let nextIp = this.ip + 1;

    try {
      const continued = this.executeInstruction(instr, nextIp);
      if (continued === false) return false;
      if (typeof continued === "number") nextIp = continued;
    } catch (e) {
      const msg = e instanceof AsmError ? e.message : (e as Error).message;
      this.err = msg + (instr.ln ? ` (line ${instr.ln})` : "");
      this.halted = true;
      return false;
    }

    this.ip = nextIp;
    this.steps++;
    if (this.ip >= this.a.instrs.length) this.halted = true;
    return !this.halted;
  }

  private executeInstruction(
    instr: Instruction,
    nextIp: number,
  ): boolean | number {
    const { op, args, rep } = instr;

    if (
      rep &&
      [
        "movsb",
        "movsw",
        "stosb",
        "stosw",
        "lodsb",
        "lodsw",
        "cmpsb",
        "cmpsw",
        "scasb",
        "scasw",
      ].includes(op)
    ) {
      return this.executeStringOp(op, rep);
    }

    switch (op) {
      case "mov": {
        const v = this.readOperand(args[1]);
        this.writeOperand(args[0], v);
        break;
      }
      case "xchg": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        this.writeOperand(args[0], b);
        this.writeOperand(args[1], a);
        break;
      }
      case "lea": {
        const addr = this.resolveMemOperand(args[1]);
        if (addr === null) throw new AsmError(`LEA needs memory operand`);
        this.writeOperand(args[0], addr);
        break;
      }
      case "add": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a + b;
        this.writeOperand(args[0], r);
        setFlagsAfterOp(this.flags, r, size, "add", a, b);
        break;
      }
      case "sub": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a - b;
        this.writeOperand(args[0], r & (size === 2 ? 0xffff : 0xff));
        setFlagsAfterOp(this.flags, r, size, "sub", a, b);
        break;
      }
      case "cmp": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a - b;
        setFlagsAfterOp(this.flags, r, size, "cmp", a, b);
        break;
      }
      case "test": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a & b;
        setLogicFlags(this.flags, r, size);
        break;
      }
      case "inc": {
        const a = this.readOperand(args[0]);
        const size = this.operandSize(args[0]);
        const r = a + 1;
        this.writeOperand(args[0], r);
        setFlagsAfterOp(this.flags, r, size, "add", a, 1);
        break;
      }
      case "dec": {
        const a = this.readOperand(args[0]);
        const size = this.operandSize(args[0]);
        const r = a - 1;
        this.writeOperand(args[0], r & (size === 2 ? 0xffff : 0xff));
        setFlagsAfterOp(this.flags, r, size, "sub", a, 1);
        break;
      }
      case "mul": {
        const b = this.readOperand(args[0]);
        const isByte = this.isReg8(args[0].toLowerCase());
        if (isByte) {
          const r = this.get8("al") * b;
          this.reg.ax = r & 0xffff;
          this.flags.CF = this.flags.OF = r > 0xff ? 1 : 0;
        } else {
          const r = this.reg.ax * b;
          this.reg.ax = r & 0xffff;
          this.reg.dx = (r >> 16) & 0xffff;
          this.flags.CF = this.flags.OF = r > 0xffff ? 1 : 0;
        }
        break;
      }
      case "imul": {
        const b = this.readOperand(args[0]);
        const r = ((this.reg.ax << 16) >> 16) * ((b << 16) >> 16);
        this.reg.ax = r & 0xffff;
        this.reg.dx = (r >> 16) & 0xffff;
        break;
      }
      case "div": {
        const b = this.readOperand(args[0]);
        if (b === 0) throw new AsmError("Division by zero");
        const isByte = this.isReg8(args[0].toLowerCase());
        if (isByte) {
          const dividend = this.reg.ax;
          this.set8("al", Math.floor(dividend / b));
          this.set8("ah", dividend % b);
        } else {
          const dividend = (this.reg.dx << 16) | this.reg.ax;
          this.reg.ax = Math.floor(dividend / b) & 0xffff;
          this.reg.dx = (dividend % b) & 0xffff;
        }
        break;
      }
      case "and": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const r = a & b;
        this.writeOperand(args[0], r);
        setLogicFlags(this.flags, r, this.operandSize(args[0]));
        break;
      }
      case "or": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const r = a | b;
        this.writeOperand(args[0], r);
        setLogicFlags(this.flags, r, this.operandSize(args[0]));
        break;
      }
      case "xor": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const r = a ^ b;
        this.writeOperand(args[0], r);
        setLogicFlags(this.flags, r, this.operandSize(args[0]));
        break;
      }
      case "not": {
        const a = this.readOperand(args[0]);
        const size = this.operandSize(args[0]);
        this.writeOperand(args[0], ~a & (size === 2 ? 0xffff : 0xff));
        break;
      }
      case "neg": {
        const a = this.readOperand(args[0]);
        const size = this.operandSize(args[0]);
        const r = (-a) & (size === 2 ? 0xffff : 0xff);
        this.writeOperand(args[0], r);
        this.flags.ZF = r === 0 ? 1 : 0;
        this.flags.CF = a !== 0 ? 1 : 0;
        break;
      }
      case "adc": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a + b + this.flags.CF;
        this.writeOperand(args[0], r);
        setFlagsAfterOp(this.flags, r, size, "add", a, b + this.flags.CF);
        break;
      }
      case "sbb": {
        const a = this.readOperand(args[0]);
        const b = this.readOperand(args[1]);
        const size = this.operandSize(args[0]);
        const r = a - b - this.flags.CF;
        this.writeOperand(args[0], r & (size === 2 ? 0xffff : 0xff));
        setFlagsAfterOp(this.flags, r, size, "sub", a, b + this.flags.CF);
        break;
      }
      case "idiv": {
        const b = this.readOperand(args[0]);
        if (b === 0) throw new AsmError("Division by zero");
        const isByte = this.isReg8(args[0].toLowerCase());
        if (isByte) {
          const dividend = (this.reg.ax << 16) >> 16;
          this.set8("al", Math.trunc(dividend / b) & 0xff);
          this.set8("ah", Math.trunc(dividend % b) & 0xff);
        } else {
          const dividend = (this.reg.dx << 16) | this.reg.ax;
          const signed = dividend > 0x7fffffff ? dividend - 0x100000000 : dividend;
          const divisor = (b << 16) >> 16;
          this.reg.ax = Math.trunc(signed / divisor) & 0xffff;
          this.reg.dx = Math.trunc(signed % divisor) & 0xffff;
        }
        break;
      }
      case "sal":
      case "shl": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const mask = size === 2 ? 0xffff : 0xff;
        const r = (a << n) & mask;
        this.writeOperand(args[0], r);
        if (n > 0) this.flags.CF = (a >> (size * 8 - n)) & 1;
        setLogicFlags(this.flags, r, size);
        break;
      }
      case "sar": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const bits = size * 8;
        const signed = (a << (32 - bits)) >> (32 - bits);
        const r = (signed >> n) & (size === 2 ? 0xffff : 0xff);
        this.writeOperand(args[0], r);
        if (n > 0) this.flags.CF = (signed >> (n - 1)) & 1;
        setLogicFlags(this.flags, r, size);
        break;
      }
      case "rol": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const bits = size * 8;
        const r = ((a << n) | (a >> (bits - n))) & (size === 2 ? 0xffff : 0xff);
        this.writeOperand(args[0], r);
        if (n > 0) this.flags.CF = r & 1;
        break;
      }
      case "ror": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const bits = size * 8;
        const r = ((a >> n) | (a << (bits - n))) & (size === 2 ? 0xffff : 0xff);
        this.writeOperand(args[0], r);
        if (n > 0) this.flags.CF = (r >> (bits - 1)) & 1;
        break;
      }
      case "rcl": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const bits = size * 8;
        let val = a;
        let cf = this.flags.CF;
        for (let i = 0; i < n; i++) {
          const newCf = (val >> (bits - 1)) & 1;
          val = ((val << 1) | cf) & (size === 2 ? 0xffff : 0xff);
          cf = newCf;
        }
        this.writeOperand(args[0], val);
        this.flags.CF = cf;
        break;
      }
      case "rcr": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const bits = size * 8;
        let val = a;
        let cf = this.flags.CF;
        for (let i = 0; i < n; i++) {
          const newCf = val & 1;
          val = ((cf << (bits - 1)) | (val >> 1)) & (size === 2 ? 0xffff : 0xff);
          cf = newCf;
        }
        this.writeOperand(args[0], val);
        this.flags.CF = cf;
        break;
      }
      case "shr": {
        const a = this.readOperand(args[0]);
        const n = this.readOperand(args[1]) & 0x1f;
        const size = this.operandSize(args[0]);
        const r = a >>> n;
        this.writeOperand(args[0], r & (size === 2 ? 0xffff : 0xff));
        if (n > 0) this.flags.CF = (a >> (n - 1)) & 1;
        setLogicFlags(this.flags, r, size);
        break;
      }
      case "aaa": {
        if ((this.get8("al") & 0x0f) > 9 || this.flags.AF) {
          this.reg.ax = (this.reg.ax + 0x106) & 0xffff;
          this.flags.AF = this.flags.CF = 1;
        } else {
          this.flags.AF = this.flags.CF = 0;
        }
        this.set8("al", this.get8("al") & 0x0f);
        break;
      }
      case "aas": {
        if ((this.get8("al") & 0x0f) > 9 || this.flags.AF) {
          this.reg.ax = (this.reg.ax - 0x106) & 0xffff;
          this.flags.AF = this.flags.CF = 1;
        } else {
          this.flags.AF = this.flags.CF = 0;
        }
        this.set8("al", this.get8("al") & 0x0f);
        break;
      }
      case "daa": {
        let al = this.get8("al");
        if ((al & 0x0f) > 9 || this.flags.AF) {
          al = (al + 6) & 0xff;
          this.flags.AF = 1;
        }
        if (al > 0x9f || this.flags.CF) {
          al = (al + 0x60) & 0xff;
          this.flags.CF = 1;
        }
        this.set8("al", al);
        setLogicFlags(this.flags, al, 1);
        break;
      }
      case "das": {
        let al = this.get8("al");
        if ((al & 0x0f) > 9 || this.flags.AF) {
          al = (al - 6) & 0xff;
          this.flags.AF = 1;
        }
        if (this.get8("al") > 0x9f || this.flags.CF) {
          al = (al - 0x60) & 0xff;
          this.flags.CF = 1;
        }
        this.set8("al", al);
        setLogicFlags(this.flags, al, 1);
        break;
      }
      case "aam": {
        const base = args[0] ? this.readOperand(args[0]) : 10;
        const al = this.get8("al");
        this.set8("ah", Math.floor(al / base) & 0xff);
        this.set8("al", (al % base) & 0xff);
        setLogicFlags(this.flags, this.get8("al"), 1);
        break;
      }
      case "aad": {
        const base = args[0] ? this.readOperand(args[0]) : 10;
        const r = (this.get8("al") + this.get8("ah") * base) & 0xff;
        this.set8("al", r);
        this.set8("ah", 0);
        setLogicFlags(this.flags, r, 1);
        break;
      }
      case "xlat":
      case "xlatb": {
        const addr = (this.reg.bx + this.get8("al")) & 0xffff;
        this.set8("al", this.mem[addr]);
        break;
      }
      case "lds":
      case "les": {
        const addr = this.resolveMemOperand(args[1]);
        if (addr === null) throw new AsmError(`${op.toUpperCase()} needs memory operand`);
        const off = this.mem[addr] | (this.mem[addr + 1] << 8);
        const seg = this.mem[addr + 2] | (this.mem[addr + 3] << 8);
        this.writeOperand(args[0], off);
        if (op === "lds") this.reg.ds = seg;
        else this.reg.es = seg;
        break;
      }
      case "cli":
        this.flags.IF = 0;
        break;
      case "sti":
        this.flags.IF = 1;
        break;
      case "hlt":
        this.halted = true;
        return false;
      case "wait":
      case "fwait":
      case "lock":
        break;
      case "in": {
        // Port I/O stub — returns 0
        this.writeOperand(args[0], 0);
        break;
      }
      case "out":
        break;
      case "cbw": {
        const al = this.get8("al");
        this.reg.ax = al >= 0x80 ? 0xff00 | al : al;
        break;
      }
      case "cwd":
        this.reg.dx = this.reg.ax & 0x8000 ? 0xffff : 0;
        break;
      case "clc":
        this.flags.CF = 0;
        break;
      case "stc":
        this.flags.CF = 1;
        break;
      case "cmc":
        this.flags.CF = this.flags.CF ? 0 : 1;
        break;
      case "cld":
        this.flags.DF = 0;
        break;
      case "std":
        this.flags.DF = 1;
        break;
      case "lahf":
        this.reg.ax = (this.reg.ax & 0xff00) | (flagsToWord(this.flags) & 0xff);
        break;
      case "sahf": {
        const low = this.get8("ah");
        const merged = (flagsToWord(this.flags) & 0xff00) | low;
        Object.assign(this.flags, flagsFromWord(merged));
        break;
      }
      case "pushf": {
        const v = flagsToWord(this.flags);
        this.reg.sp -= 2;
        writeUnit(this.mem, this.reg.sp, v, 2);
        this.dataStack.push(v);
        break;
      }
      case "popf": {
        const v = this.mem[this.reg.sp] | (this.mem[this.reg.sp + 1] << 8);
        this.reg.sp += 2;
        if (this.dataStack.length) this.dataStack.pop();
        Object.assign(this.flags, flagsFromWord(v));
        break;
      }
      case "push": {
        const v = this.readOperand(args[0]);
        this.reg.sp -= 2;
        writeUnit(this.mem, this.reg.sp, v, 2);
        this.dataStack.push(v);
        break;
      }
      case "pop": {
        const v = this.mem[this.reg.sp] | (this.mem[this.reg.sp + 1] << 8);
        this.reg.sp += 2;
        if (this.dataStack.length) this.dataStack.pop();
        this.writeOperand(args[0], v);
        break;
      }
      case "jmp":
        this.jumpTo(args[0]);
        return this.ip;
      case "je":
      case "jz":
        if (this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jne":
      case "jnz":
        if (!this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jg":
      case "jnle":
        if (!this.flags.ZF && this.flags.SF === this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jge":
      case "jnl":
        if (this.flags.SF === this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jl":
      case "jnge":
        if (this.flags.SF !== this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jle":
      case "jng":
        if (this.flags.ZF || this.flags.SF !== this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "ja":
      case "jnbe":
        if (!this.flags.CF && !this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jae":
      case "jnb":
      case "jnc":
        if (!this.flags.CF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jb":
      case "jnae":
      case "jc":
        if (this.flags.CF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jbe":
      case "jna":
        if (this.flags.CF || this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "js":
        if (this.flags.SF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jns":
        if (!this.flags.SF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jo":
        if (this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jno":
        if (!this.flags.OF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jp":
      case "jpe":
        if (this.flags.PF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jnp":
      case "jpo":
        if (!this.flags.PF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "jcxz":
        if (this.reg.cx === 0) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "loop":
        this.reg.cx = (this.reg.cx - 1) & 0xffff;
        if (this.reg.cx !== 0) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "loope":
      case "loopz":
        this.reg.cx = (this.reg.cx - 1) & 0xffff;
        if (this.reg.cx !== 0 && this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "loopne":
      case "loopnz":
        this.reg.cx = (this.reg.cx - 1) & 0xffff;
        if (this.reg.cx !== 0 && !this.flags.ZF) {
          this.jumpTo(args[0]);
          return this.ip;
        }
        break;
      case "call":
        this.callStack.push(this.ip + 1);
        this.jumpTo(args[0]);
        return this.ip;
      case "ret":
        if (this.callStack.length === 0) {
          this.halted = true;
          return false;
        }
        return this.callStack.pop()!;
      case "nop":
        break;
      case "movsb":
      case "movsw":
      case "stosb":
      case "stosw":
      case "lodsb":
      case "lodsw":
      case "cmpsb":
      case "cmpsw":
      case "scasb":
      case "scasw":
        this.executeStringOp(op, rep);
        break;
      case "int": {
        const n = parseNumber(args[0]) ?? parseInt(args[0], 16);
        if (Number.isNaN(n)) throw new AsmError(`Bad interrupt number "${args[0]}"`, instr.ln);
        const ctx = {
          get8: (r: Reg8Name) => this.get8(r),
          set8: (r: Reg8Name, v: number) => this.set8(r, v),
          get16: (r: Reg16Name) => this.reg[r],
          reg: this.reg,
          mem: this.mem,
          print: (s: string) => this.print(s),
          halt: () => {
            this.halted = true;
          },
          readInputChar: () => this.readInputChar(),
          peekInputChar: () => this.peekInputChar(),
          waitingForInput: this.waitingForInput,
        };
        const result = handleInterrupt(n, ctx);
        this.waitingForInput = ctx.waitingForInput;
        if (result.halt) {
          this.halted = true;
          return false;
        }
        if (result.waitForInput) return this.ip;
        if (!result.handled) {
          throw new AsmError(`Unsupported interrupt 0x${n.toString(16)}`, instr.ln);
        }
        break;
      }
      case "into":
        if (this.flags.OF) throw new AsmError("INTO: overflow trap");
        break;
      case "iret":
        if (this.callStack.length === 0) {
          this.halted = true;
          return false;
        }
        return this.callStack.pop()!;
      default:
        throw new AsmError(`Unsupported instruction "${op.toUpperCase()}"`, instr.ln);
    }

    return nextIp;
  }

  private executeStringOp(
    op: string,
    rep?: Instruction["rep"],
  ): boolean | number {
    const step = op.endsWith("w") ? 2 : 1;
    const count = rep ? this.reg.cx : 1;
    const df = this.flags.DF ? -step : step;

    for (let i = 0; i < count; i++) {
      if (rep && this.reg.cx === 0) break;

      switch (op) {
        case "movsb":
        case "movsw": {
          const val =
            step === 2
              ? this.mem[this.reg.si] | (this.mem[this.reg.si + 1] << 8)
              : this.mem[this.reg.si];
          if (step === 2) writeUnit(this.mem, this.reg.di, val, 2);
          else this.mem[this.reg.di] = val & 0xff;
          this.reg.si = (this.reg.si + df) & 0xffff;
          this.reg.di = (this.reg.di + df) & 0xffff;
          break;
        }
        case "stosb":
        case "stosw": {
          const val = step === 2 ? this.reg.ax : this.get8("al");
          if (step === 2) writeUnit(this.mem, this.reg.di, val, 2);
          else this.mem[this.reg.di] = val & 0xff;
          this.reg.di = (this.reg.di + df) & 0xffff;
          break;
        }
        case "lodsb":
        case "lodsw": {
          const val =
            step === 2
              ? this.mem[this.reg.si] | (this.mem[this.reg.si + 1] << 8)
              : this.mem[this.reg.si];
          if (step === 2) this.reg.ax = val;
          else this.set8("al", val);
          this.reg.si = (this.reg.si + df) & 0xffff;
          break;
        }
        case "cmpsb":
        case "cmpsw": {
          const a =
            step === 2
              ? this.mem[this.reg.si] | (this.mem[this.reg.si + 1] << 8)
              : this.mem[this.reg.si];
          const b =
            step === 2
              ? this.mem[this.reg.di] | (this.mem[this.reg.di + 1] << 8)
              : this.mem[this.reg.di];
          setFlagsAfterOp(this.flags, a - b, step as 1 | 2, "cmp", a, b);
          this.reg.si = (this.reg.si + df) & 0xffff;
          this.reg.di = (this.reg.di + df) & 0xffff;
          break;
        }
        case "scasb":
        case "scasw": {
          const a = step === 2 ? this.reg.ax : this.get8("al");
          const b =
            step === 2
              ? this.mem[this.reg.di] | (this.mem[this.reg.di + 1] << 8)
              : this.mem[this.reg.di];
          setFlagsAfterOp(this.flags, a - b, step as 1 | 2, "cmp", a, b);
          this.reg.di = (this.reg.di + df) & 0xffff;
          break;
        }
      }

      if (rep) {
        this.reg.cx = (this.reg.cx - 1) & 0xffff;
        if (rep === "repe" || rep === "repz") {
          if (!this.flags.ZF) break;
        } else if (rep === "repne" || rep === "repnz") {
          if (this.flags.ZF) break;
        }
        if (this.reg.cx === 0) break;
      } else {
        break;
      }
    }

    return this.ip + 1;
  }
}

export function createMachine(assembled: AssembledProgram): Machine {
  return new Machine(assembled);
}

export function resetMachine(assembled: AssembledProgram): Machine {
  return new Machine(assembled);
}
