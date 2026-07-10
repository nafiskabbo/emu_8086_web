"use client";

import type { RunState } from "@/lib/emulator";
import type { SampleKey } from "@/lib/emulator";
import { SAMPLE_OPTIONS } from "@/lib/emulator";
import { BrandWordmark } from "@/components/brand/brand-mark";

interface ToolbarProps {
  runState: RunState;
  canRun: boolean;
  isRunning: boolean;
  runSpeed: number;
  theme: "dark" | "light";
  onAssemble: () => void;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSample: (key: SampleKey) => void;
  onOpen: () => void;
  onSave: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
  onSpeedChange: (ms: number) => void;
}

const BADGE: Record<RunState, string> = {
  idle: "idle",
  ready: "ready",
  running: "running",
  halted: "halted",
  error: "error",
};

export function Toolbar({
  runState,
  canRun,
  isRunning,
  runSpeed,
  theme,
  onAssemble,
  onRun,
  onPause,
  onStep,
  onReset,
  onSample,
  onOpen,
  onSave,
  onShare,
  onToggleTheme,
  onShowShortcuts,
  onSpeedChange,
}: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line bg-linear-to-b from-[var(--panel)] to-[var(--bg)] px-4 py-2.5">
      <div className="min-w-0">
        <BrandWordmark />
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-ink-dim">
          8086 assembler & step debugger
        </p>
      </div>

      <select
        className="rounded border border-line bg-panel-2 px-2 py-2 font-mono text-xs text-ink"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as SampleKey;
          if (v) onSample(v);
          e.target.value = "";
        }}
      >
        <option value="">Load sample…</option>
        {SAMPLE_OPTIONS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" className="btn" onClick={onOpen} title="Open .asm">
          Open
        </button>
        <button type="button" className="btn" onClick={onSave} title="Save .asm">
          Save
        </button>
        <button type="button" className="btn" onClick={onShare} title="Copy share link">
          Share
        </button>
        <div className="hidden h-6 w-px bg-line sm:block" />
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAssemble}
          title="Compile (F5)"
        >
          Compile
        </button>
        {isRunning ? (
          <button type="button" className="btn" onClick={onPause} title="Pause (Esc)">
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={!canRun}
            onClick={onRun}
            title="Run"
          >
            Run ▶
          </button>
        )}
        <button
          type="button"
          className="btn"
          disabled={!canRun || isRunning}
          onClick={onStep}
          title="Step (F8)"
        >
          Step ▸
        </button>
        <button type="button" className="btn btn-danger" onClick={onReset} title="Reset">
          Reset
        </button>
        <div className="hidden h-6 w-px bg-line sm:block" />
        <label className="hidden items-center gap-2 text-[10px] uppercase tracking-wider text-ink-dim lg:flex">
          Speed
          <input
            type="range"
            min={1}
            max={100}
            value={101 - runSpeed}
            onChange={(e) => onSpeedChange(101 - Number(e.target.value))}
            className="w-20 accent-amber"
          />
        </label>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <span
          className={`badge ${runState === "running" ? "badge-live" : ""} ${runState === "halted" ? "badge-halt" : ""} ${runState === "error" ? "badge-error" : ""}`}
        >
          {BADGE[runState]}
        </span>
      </div>
    </header>
  );
}
