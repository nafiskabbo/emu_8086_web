"use client";

import { useEffect, useRef } from "react";
import type { Machine } from "@/lib/emulator/machine";
import { hex4 } from "@/lib/emulator";

interface ConsolePanelProps {
  machine: Machine | null;
  waitingForInput: boolean;
  onInput: (char: string) => void;
  onCopy: () => void;
}

export function ConsolePanel({
  machine,
  waitingForInput,
  onInput,
  onCopy,
}: ConsolePanelProps) {
  const crtRef = useRef<HTMLDivElement>(null);
  const output = machine?.output ?? "";

  useEffect(() => {
    if (crtRef.current) {
      crtRef.current.scrollTop = crtRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex flex-col">
      <div className="paneltitle flex items-center justify-between">
        <span>Console output</span>
        <button type="button" className="text-[10px] text-ink-dim hover:text-amber" onClick={onCopy}>
          Copy
        </button>
      </div>
      <div className="relative mx-3.5 mb-3.5 overflow-hidden rounded-md border border-[var(--console-border)] bg-[var(--console-bg)] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
        <div
          ref={crtRef}
          className="crt max-h-[190px] min-h-[120px] overflow-y-auto px-3.5 py-3 font-[family-name:var(--font-vt323)] text-[19px] leading-tight whitespace-pre-wrap text-[var(--console-fg)]"
          style={{ textShadow: "0 0 6px var(--console-glow)" }}
        >
          {output}
          <span className="crt-cursor" />
        </div>
        <div className="scanlines absolute inset-0" />
      </div>
      {waitingForInput && (
        <div className="mx-3.5 mb-3 flex items-center gap-2">
          <label className="text-xs text-ink-dim">Input:</label>
          <input
            type="text"
            className="flex-1 rounded border border-line bg-panel-2 px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-amber"
            maxLength={1}
            autoFocus
            onKeyDown={(e) => {
              if (e.key.length === 1) {
                onInput(e.key);
                (e.target as HTMLInputElement).value = "";
              } else if (e.key === "Enter") {
                onInput("\r");
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

interface RegisterPanelProps {
  machine: Machine | null;
}

export function RegisterPanel({ machine }: RegisterPanelProps) {
  const r = machine?.reg ?? {
    ax: 0, bx: 0, cx: 0, dx: 0, si: 0, di: 0, bp: 0, sp: 0,
    ds: 0, es: 0, ss: 0, cs: 0,
  };
  const order = ["ax", "bx", "cx", "dx", "si", "di", "bp", "sp"] as const;
  const segOrder = ["ds", "es", "ss", "cs"] as const;
  const ipVal = machine && !machine.halted ? machine.ip : 0;

  return (
    <>
      <div className="paneltitle">CPU registers</div>
      <div className="grid grid-cols-4 gap-px bg-line">
        {order.map((k) => (
          <div key={k} className="bg-panel px-2.5 py-2">
            <div className="text-[10px] tracking-wider text-ink-dim uppercase">{k}</div>
            <div className="mt-0.5 font-mono text-base font-semibold text-green">{hex4(r[k])}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-px border-b border-line bg-line">
        {segOrder.map((k) => (
          <div key={k} className="bg-panel px-2.5 py-2">
            <div className="text-[10px] tracking-wider text-ink-dim uppercase">{k}</div>
            <div className="mt-0.5 font-mono text-sm text-ink">{hex4(r[k])}</div>
          </div>
        ))}
        <div className="bg-panel px-2.5 py-2">
          <div className="text-[10px] tracking-wider text-ink-dim uppercase">ip</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{hex4(ipVal)}</div>
        </div>
      </div>
    </>
  );
}

export function FlagsPanel({ machine }: RegisterPanelProps) {
  const f = machine?.flags ?? {
    CF: 0, PF: 0, AF: 0, ZF: 0, SF: 0, TF: 0, IF: 1, DF: 0, OF: 0,
  };
  const names = ["CF", "PF", "AF", "ZF", "SF", "TF", "IF", "DF", "OF"] as const;

  return (
    <>
      <div className="paneltitle">Flags register</div>
      <div className="flex flex-wrap gap-2.5 border-b border-line bg-panel px-3.5 py-2.5">
        {names.map((n) => (
          <div
            key={n}
            className={`flex items-center gap-1.5 text-[11.5px] ${f[n] ? "text-ink" : "text-ink-dim"}`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full border"
              style={{
                background: f[n] ? "var(--led-on)" : "var(--led-off)",
                borderColor: f[n] ? "var(--led-on)" : "var(--line)",
                boxShadow: f[n] ? "0 0 6px var(--led-on)" : "none",
              }}
            />
            {n}
          </div>
        ))}
      </div>
    </>
  );
}

export function StatusLine({ machine }: RegisterPanelProps) {
  const curInstr =
    machine && !machine.halted && machine.a.instrs[machine.ip]
      ? machine.a.instrs[machine.ip]
      : null;

  return (
    <div className="flex gap-4 border-b border-line bg-panel px-3.5 py-2 text-xs text-ink-dim">
      <span>
        Current line →{" "}
        <b className="text-amber">
          {curInstr ? `line ${curInstr.ln} — ${curInstr.op.toUpperCase()}` : "halted"}
        </b>
      </span>
      <span>
        Instructions executed: <b className="text-amber">{machine?.steps ?? 0}</b>
      </span>
    </div>
  );
}
