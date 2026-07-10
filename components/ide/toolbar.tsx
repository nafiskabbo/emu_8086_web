"use client";

import type { RunState, SampleKey } from "@/lib/emulator";
import { SAMPLE_OPTIONS } from "@/lib/emulator";
import { BrandWordmark } from "@/components/brand/brand-mark";
import { HelpMenu } from "@/components/ide/help-menu";
import { APP_VERSION } from "@/lib/version";

interface ToolbarProps {
  runState: RunState;
  canRun: boolean;
  isRunning: boolean;
  runSpeed: number;
  theme: "dark" | "light";
  fileName: string;
  onAssemble: () => void;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSample: (key: SampleKey) => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
  onSpeedChange: (ms: number) => void;
  onOpenSettings: () => void;
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
  fileName,
  onAssemble,
  onRun,
  onPause,
  onStep,
  onReset,
  onSample,
  onOpen,
  onSave,
  onSaveAs,
  onShare,
  onToggleTheme,
  onSpeedChange,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-line bg-linear-to-b from-[var(--panel)] to-[var(--bg)] px-2 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
      <div className="min-w-0">
        <BrandWordmark />
        <p className="mt-0.5 hidden text-[10px] uppercase tracking-[0.14em] text-ink-dim sm:block">
          v{APP_VERSION} · {fileName || "no file"}
        </p>
      </div>

      <select
        className="max-w-[140px] rounded border border-line bg-panel-2 px-2 py-2 font-mono text-xs text-ink sm:max-w-none"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as SampleKey;
          if (v) onSample(v);
          e.target.value = "";
        }}
      >
        <option value="">Sample…</option>
        {SAMPLE_OPTIONS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button type="button" className="btn" onClick={onOpen} title="Open .asm">
          Open
        </button>
        <button type="button" className="btn" onClick={onSave} title="Save (Ctrl+S)">
          Save
        </button>
        <button
          type="button"
          className="btn hidden sm:inline-flex"
          onClick={onSaveAs}
          title="Save as…"
        >
          Save as
        </button>
        <button
          type="button"
          className="btn hidden md:inline-flex"
          onClick={onShare}
          title="Copy share link"
        >
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
            Run
          </button>
        )}
        <button
          type="button"
          className="btn"
          disabled={!canRun || isRunning}
          onClick={onStep}
          title="Step (F8)"
        >
          Step
        </button>
        <button type="button" className="btn btn-danger" onClick={onReset} title="Reset">
          Reset
        </button>
        <div className="hidden h-6 w-px bg-line lg:block" />
        <label className="hidden items-center gap-2 text-[10px] uppercase tracking-wider text-ink-dim xl:flex">
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
        <HelpMenu onOpenSettings={onOpenSettings} />
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
