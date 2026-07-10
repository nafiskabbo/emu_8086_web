import type { Reg16Name, Reg8Name } from "./types";

export const REG8: readonly Reg8Name[] = [
  "al",
  "ah",
  "bl",
  "bh",
  "cl",
  "ch",
  "dl",
  "dh",
];

export const REG16: readonly Reg16Name[] = [
  "ax",
  "bx",
  "cx",
  "dx",
  "si",
  "di",
  "bp",
  "sp",
  "ds",
  "es",
  "ss",
  "cs",
];

export const REG8_TO_REG16: Record<Reg8Name, Reg16Name> = {
  al: "ax",
  ah: "ax",
  bl: "bx",
  bh: "bx",
  cl: "cx",
  ch: "cx",
  dl: "dx",
  dh: "dx",
};

export const FLAG_NAMES = [
  "CF",
  "PF",
  "AF",
  "ZF",
  "SF",
  "TF",
  "IF",
  "DF",
  "OF",
] as const;

export const INSTRUCTION_LIMIT = 2_000_000;
