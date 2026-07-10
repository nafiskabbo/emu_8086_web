import { AsmError } from "./errors";
import type { AssembledProgram, Instruction } from "./types";
import {
  parseNumber,
  splitArgs,
  stripComment,
  writeUnit,
} from "./utils";

/**
 * Assemble MASM-style 8086 source into an interpretive program model.
 * Uses a flat memory model: data starts at offset 0, code is instruction list.
 */
export function assemble(src: string): AssembledProgram {
  const rawLines = src.split("\n");
  const mem = new Uint8Array(65536);
  const dataVars: AssembledProgram["dataVars"] = {};
  let dataPtr = 0;
  const instrs: Instruction[] = [];
  const labels: Record<string, number> = {};
  let section: "data" | "code" | null = null;
  let entryLabel: string | null = null;

  const cleaned: { text: string; ln: number }[] = [];
  for (let ln = 0; ln < rawLines.length; ln++) {
    const line = stripComment(rawLines[ln]).trim();
    if (!line) continue;
    cleaned.push({ text: line, ln: ln + 1 });
  }

  for (const { text, ln } of cleaned) {
    const lower = text.toLowerCase();

    if (/^\.model\b/i.test(text)) continue;
    if (/^\.stack\b/i.test(text)) continue;
    if (/^\.data\b/i.test(text)) {
      section = "data";
      continue;
    }
    if (/^\.code\b/i.test(text)) {
      section = "code";
      continue;
    }
    if (/^end\s+/i.test(text) || /^end$/i.test(lower)) {
      const m = text.match(/^end\s+(\w+)/i);
      if (m) entryLabel = m[1].toLowerCase();
      continue;
    }

    if (section === "data") {
      parseDataLine(text, ln, mem, dataVars, () => dataPtr, (v) => {
        dataPtr = v;
      });
      continue;
    }

    if (section === "code" || section === null) {
      parseCodeLine(text, ln, instrs, labels);
    }
  }

  let entry = 0;
  if (entryLabel && labels[entryLabel] !== undefined) {
    entry = labels[entryLabel];
  }

  return { mem, dataVars, instrs, labels, entry };
}

function parseDataLine(
  text: string,
  ln: number,
  mem: Uint8Array,
  dataVars: AssembledProgram["dataVars"],
  getPtr: () => number,
  setPtr: (v: number) => void,
): void {
  const m = text.match(/^(\w+)\s+(db|dw)\s+(.*)$/i);
  if (!m) throw new AsmError(`Cannot parse data declaration: "${text}"`, ln);

  const name = m[1].toLowerCase();
  const kind = m[2].toLowerCase();
  const rest = m[3];
  const unitSize = kind === "dw" ? 2 : 1;
  const addr = getPtr();
  let count = 0;
  let dataPtr = getPtr();

  const parts = splitArgs(rest);
  for (let p of parts) {
    p = p.trim();
    const dupM = p.match(/^(\d+)\s+dup\s*\(\s*(.*?)\s*\)$/i);
    if (dupM) {
      const n = parseInt(dupM[1], 10);
      const fillTok = dupM[2].trim();
      const fillVal = fillTok === "?" ? 0 : (parseNumber(fillTok) ?? 0);
      for (let k = 0; k < n; k++) {
        writeUnit(mem, dataPtr, fillVal, unitSize as 1 | 2);
        dataPtr += unitSize;
        count++;
      }
      continue;
    }
    if (/^'.*'$/.test(p)) {
      const str = p.slice(1, -1);
      for (let k = 0; k < str.length; k++) {
        writeUnit(mem, dataPtr, str.charCodeAt(k), unitSize as 1 | 2);
        dataPtr += unitSize;
        count++;
      }
      continue;
    }
    if (p === "?") {
      writeUnit(mem, dataPtr, 0, unitSize as 1 | 2);
      dataPtr += unitSize;
      count++;
      continue;
    }
    const val = parseNumber(p);
    if (val === null)
      throw new AsmError(`Bad value "${p}" in data declaration`, ln);
    writeUnit(mem, dataPtr, val, unitSize as 1 | 2);
    dataPtr += unitSize;
    count++;
  }

  setPtr(dataPtr);
  dataVars[name] = { addr, unitSize: unitSize as 1 | 2, count };
}

function parseCodeLine(
  text: string,
  ln: number,
  instrs: Instruction[],
  labels: Record<string, number>,
): void {
  let line = text;

  const procM = line.match(/^(\w+)\s+proc\b/i);
  if (procM) {
    labels[procM[1].toLowerCase()] = instrs.length;
    return;
  }

  if (/^(\w+)\s+endp\b/i.test(line)) return;

  const labelM = line.match(/^(\w+)\s*:\s*(.*)$/);
  if (labelM) {
    labels[labelM[1].toLowerCase()] = instrs.length;
    line = labelM[2].trim();
    if (!line) return;
  }

  const repM = line.match(/^(repne|repnz|repe|repz|rep)\s+(.+)$/i);
  let rep: Instruction["rep"];
  if (repM) {
    const r = repM[1].toLowerCase();
    rep =
      r === "repne" || r === "repnz"
        ? "repne"
        : r === "repe" || r === "repz"
          ? "repe"
          : "rep";
    line = repM[2].trim();
  }

  const im = line.match(/^([a-z]+)\s*(.*)$/i);
  if (!im) throw new AsmError(`Cannot parse instruction: "${text}"`, ln);

  const op = im[1].toLowerCase();
  const argStr = im[2].trim();
  const args = argStr ? splitArgs(argStr).map((a) => a.trim()) : [];
  instrs.push({ op, args, ln, rep });
}
