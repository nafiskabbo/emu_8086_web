"use client";

import type { AssembledProgram } from "@/lib/emulator";
import type { Machine } from "@/lib/emulator/machine";
import { hex2, hex4 } from "@/lib/emulator";

interface MemoryPanelsProps {
  assembled: AssembledProgram | null;
  machine: Machine | null;
  hexBase: number;
  onHexBaseChange: (base: number) => void;
}

export function DataSegmentPanel({ assembled, machine }: MemoryPanelsProps) {
  if (!assembled || Object.keys(assembled.dataVars).length === 0) {
    return (
      <>
        <div className="paneltitle">Data segment</div>
        <p className="px-3.5 py-4 text-xs text-ink-dim">
          Assemble a program to see declared variables here.
        </p>
      </>
    );
  }

  const mem = machine?.mem ?? assembled.mem;

  return (
    <>
      <div className="paneltitle">Data segment</div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="sticky top-0 bg-panel text-[10.5px] tracking-wide text-ink-dim uppercase">
              <th className="px-2.5 py-1.5 text-left font-semibold">Name</th>
              <th className="px-2.5 py-1.5 text-left font-semibold">Type</th>
              <th className="px-2.5 py-1.5 text-left font-semibold">Addr</th>
              <th className="px-2.5 py-1.5 text-left font-semibold">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(assembled.dataVars).map(([name, info]) => {
              const vals: (string | number)[] = [];
              for (let i = 0; i < info.count; i++) {
                const addr = info.addr + i * info.unitSize;
                const v =
                  info.unitSize === 2
                    ? mem[addr] | (mem[addr + 1] << 8)
                    : mem[addr];
                vals.push(
                  info.unitSize === 1 && v >= 32 && v < 127
                    ? `'${String.fromCharCode(v)}'`
                    : v,
                );
                if (vals.length >= 8) {
                  vals.push("…");
                  break;
                }
              }
              return (
                <tr key={name} className="border-b border-line/50 hover:bg-panel-2/40">
                  <td className="px-2.5 py-1.5 text-amber">{name}</td>
                  <td className="px-2.5 py-1.5">{info.unitSize === 2 ? "WORD" : "BYTE"}</td>
                  <td className="px-2.5 py-1.5">0x{info.addr.toString(16).padStart(4, "0")}</td>
                  <td className="px-2.5 py-1.5">{vals.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function HexDumpPanel({
  machine,
  hexBase,
  onHexBaseChange,
}: MemoryPanelsProps) {
  const mem = machine?.mem;
  const rows = 8;
  const cols = 16;

  return (
    <>
      <div className="paneltitle flex items-center justify-between">
        <span>Memory dump</span>
        <label className="flex items-center gap-2 text-[10px] font-normal normal-case tracking-normal text-ink-dim">
          Base
          <input
            type="text"
            value={`0x${hexBase.toString(16).padStart(4, "0")}`}
            onChange={(e) => {
              const v = parseInt(e.target.value.replace(/^0x/i, ""), 16);
              if (!Number.isNaN(v)) onHexBaseChange(v & 0xffff);
            }}
            className="w-20 rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-ink"
          />
        </label>
      </div>
      <div className="max-h-40 overflow-auto font-mono text-[11px]">
        {!mem ? (
          <p className="px-3.5 py-4 text-xs text-ink-dim">Assemble to view memory.</p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {Array.from({ length: rows }, (_, row) => {
                const addr = (hexBase + row * cols) & 0xffff;
                const bytes = Array.from({ length: cols }, (_, col) => {
                  const a = (addr + col) & 0xffff;
                  return mem[a];
                });
                const ascii = bytes
                  .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                  .join("");
                return (
                  <tr key={row} className="border-b border-line/30 hover:bg-panel-2/30">
                    <td className="px-2 py-0.5 text-amber">{hex4(addr)}</td>
                    <td className="px-2 py-0.5 text-ink-dim">
                      {bytes.map(hex2).join(" ")}
                    </td>
                    <td className="px-2 py-0.5 text-ink-dim">{ascii}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function StackPanels({ machine }: { machine: Machine | null }) {
  const dataStack = machine?.dataStack ?? [];
  const callStack = machine?.callStack ?? [];

  return (
    <>
      <div className="paneltitle">Stack (PUSH values)</div>
      <div className="max-h-24 overflow-auto">
        {dataStack.length === 0 ? (
          <p className="px-3.5 py-3 text-xs text-ink-dim">Empty.</p>
        ) : (
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="text-[10px] text-ink-dim uppercase">
                <th className="px-2.5 py-1 text-left">Offset</th>
                <th className="px-2.5 py-1 text-left">Hex</th>
                <th className="px-2.5 py-1 text-left">Dec</th>
              </tr>
            </thead>
            <tbody>
              {[...dataStack].reverse().map((v, i) => (
                <tr key={i} className="border-b border-line/30">
                  <td className="px-2.5 py-1">SP+{i * 2}</td>
                  <td className="px-2.5 py-1">{hex4(v)}</td>
                  <td className="px-2.5 py-1">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="paneltitle">Call stack</div>
      <div className="max-h-20 overflow-auto">
        {callStack.length === 0 ? (
          <p className="px-3.5 py-3 text-xs text-ink-dim">No active calls.</p>
        ) : (
          <ul className="px-3.5 py-2 font-mono text-xs text-ink">
            {[...callStack].reverse().map((ip, i) => (
              <li key={i} className="py-0.5">
                return → instr #{ip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
