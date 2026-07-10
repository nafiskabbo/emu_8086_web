import type { Flags } from "./types";
import { parityOf } from "./utils";

export function createDefaultFlags(): Flags {
  return {
    CF: 0,
    PF: 0,
    AF: 0,
    ZF: 0,
    SF: 0,
    TF: 0,
    IF: 1,
    DF: 0,
    OF: 0,
  };
}

export function flagsToWord(flags: Flags): number {
  let word = 0x0002;
  if (flags.CF) word |= 0x0001;
  if (flags.PF) word |= 0x0004;
  if (flags.AF) word |= 0x0010;
  if (flags.ZF) word |= 0x0040;
  if (flags.SF) word |= 0x0080;
  if (flags.TF) word |= 0x0100;
  if (flags.IF) word |= 0x0200;
  if (flags.DF) word |= 0x0400;
  if (flags.OF) word |= 0x0800;
  return word & 0xffff;
}

export function flagsFromWord(word: number): Flags {
  return {
    CF: word & 0x0001 ? 1 : 0,
    PF: word & 0x0004 ? 1 : 0,
    AF: word & 0x0010 ? 1 : 0,
    ZF: word & 0x0040 ? 1 : 0,
    SF: word & 0x0080 ? 1 : 0,
    TF: word & 0x0100 ? 1 : 0,
    IF: word & 0x0200 ? 1 : 0,
    DF: word & 0x0400 ? 1 : 0,
    OF: word & 0x0800 ? 1 : 0,
  };
}

export function setFlagsAfterOp(
  flags: Flags,
  result: number,
  size: 1 | 2,
  opType: "add" | "sub" | "cmp",
  a: number,
  b: number,
): void {
  const mask = size === 2 ? 0xffff : 0xff;
  const signBit = size === 2 ? 0x8000 : 0x80;
  flags.ZF = (result & mask) === 0 ? 1 : 0;
  flags.SF = result & signBit ? 1 : 0;
  flags.PF = parityOf(result & 0xff);
  flags.AF = (a ^ b ^ result) & 0x10 ? 1 : 0;
  if (opType === "add") {
    flags.CF = result > mask ? 1 : 0;
    const sa = a & signBit;
    const sb = b & signBit;
    const sr = result & signBit;
    flags.OF = sa === sb && sr !== sa ? 1 : 0;
  } else {
    flags.CF = a < b ? 1 : 0;
    const sa = a & signBit;
    const sb = b & signBit;
    const sr = result & signBit;
    flags.OF = sa !== sb && sr !== sa ? 1 : 0;
  }
}

export function setLogicFlags(flags: Flags, result: number, size: 1 | 2): void {
  const mask = size === 2 ? 0xffff : 0xff;
  const signBit = size === 2 ? 0x8000 : 0x80;
  flags.ZF = (result & mask) === 0 ? 1 : 0;
  flags.SF = result & signBit ? 1 : 0;
  flags.PF = parityOf(result & 0xff);
  flags.CF = 0;
  flags.OF = 0;
}
