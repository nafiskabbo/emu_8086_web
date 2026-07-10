/** Core types for the interpretive 8086 assembler and emulator. */

export type FlagName =
  | "CF"
  | "PF"
  | "AF"
  | "ZF"
  | "SF"
  | "TF"
  | "IF"
  | "DF"
  | "OF";

export type Flags = Record<FlagName, number>;

export type Reg16Name =
  | "ax"
  | "bx"
  | "cx"
  | "dx"
  | "si"
  | "di"
  | "bp"
  | "sp"
  | "ds"
  | "es"
  | "ss"
  | "cs";

export type Reg8Name =
  | "al"
  | "ah"
  | "bl"
  | "bh"
  | "cl"
  | "ch"
  | "dl"
  | "dh";

export type Registers = Record<Reg16Name, number>;

export interface DataVariable {
  addr: number;
  unitSize: 1 | 2;
  count: number;
}

export interface Instruction {
  op: string;
  args: string[];
  ln: number;
  rep?: "rep" | "repne" | "repe" | "repz" | "repnz";
}

export interface AssembledProgram {
  mem: Uint8Array;
  dataVars: Record<string, DataVariable>;
  instrs: Instruction[];
  labels: Record<string, number>;
  entry: number;
}

export type RunState = "idle" | "ready" | "running" | "halted" | "error";

export interface MachineSnapshot {
  reg: Registers;
  flags: Flags;
  ip: number;
  halted: boolean;
  output: string;
  callStack: number[];
  dataStack: number[];
  steps: number;
  err: string | null;
  inputQueue: string[];
  waitingForInput: boolean;
}

export interface DosContext {
  get8: (reg: Reg8Name) => number;
  set8: (reg: Reg8Name, val: number) => void;
  get16: (reg: Reg16Name) => number;
  reg: Registers;
  mem: Uint8Array;
  print: (text: string) => void;
  halt: () => void;
  readInputChar: () => string | null;
  peekInputChar: () => string | null;
  waitingForInput: boolean;
}

export interface DosHandlerResult {
  handled: boolean;
  halt?: boolean;
  waitForInput?: boolean;
}
