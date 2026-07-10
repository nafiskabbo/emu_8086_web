"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assemble,
  AUTOSAVE_KEY,
  createMachine,
  decodeProgramFromShare,
  DEFAULT_SOURCE,
  encodeProgramToShare,
  INSTRUCTION_LIMIT,
  type AssembledProgram,
  type RunState,
  type SampleKey,
  SAMPLES,
  THEME_KEY,
} from "@/lib/emulator";
import { Machine } from "@/lib/emulator/machine";

export type Theme = "dark" | "light";

export function useEmulator(initialSource?: string) {
  const [source, setSource] = useState(initialSource ?? DEFAULT_SOURCE);
  const [assembled, setAssembled] = useState<AssembledProgram | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [assemblyError, setAssemblyError] = useState<string | null>(null);
  const [assemblyErrorLine, setAssemblyErrorLine] = useState<number | null>(
    null,
  );
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [runSpeed, setRunSpeed] = useState(16);
  const [theme, setTheme] = useState<Theme>("dark");
  const [hexBase, setHexBase] = useState(0);
  const [tick, setTick] = useState(0);

  const runTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guardRef = useRef(0);
  const machineRef = useRef<Machine | null>(null);
  const breakpointsRef = useRef(breakpoints);

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
      queueMicrotask(() => setTheme(savedTheme));
    }

    const params = new URLSearchParams(window.location.search);
    const shared = params.get("p");
    queueMicrotask(() => {
      if (shared) {
        const decoded = decodeProgramFromShare(shared);
        if (decoded) setSource(decoded);
        else {
          const saved = localStorage.getItem(AUTOSAVE_KEY);
          if (saved) setSource(saved);
        }
      } else {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved && !initialSource) setSource(saved);
      }
    });
  }, [initialSource]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, source);
    }, 500);
    return () => clearTimeout(timer);
  }, [source]);

  const stopRun = useCallback(() => {
    if (runTimerRef.current) {
      clearInterval(runTimerRef.current);
      runTimerRef.current = null;
    }
    guardRef.current = 0;
  }, []);

  const doAssemble = useCallback(() => {
    stopRun();
    setAssemblyError(null);
    setAssemblyErrorLine(null);
    try {
      const program = assemble(source);
      const m = createMachine(program);
      setAssembled(program);
      setMachine(m);
      machineRef.current = m;
      setRunState("ready");
      refresh();
      return true;
    } catch (e) {
      const err = e as Error & { line?: number };
      const line =
        typeof err.line === "number"
          ? err.line
          : (() => {
              const m = (err.message ?? "").match(/\bline\s+(\d+)\b/i);
              return m ? parseInt(m[1], 10) : null;
            })();
      const msg = err.message ?? "Assembly failed";
      setAssembled(null);
      setMachine(null);
      machineRef.current = null;
      setAssemblyError(line != null ? `Line ${line}: ${msg}` : msg);
      setAssemblyErrorLine(line);
      setRunState("error");
      refresh();
      return false;
    }
  }, [source, stopRun, refresh]);

  const doReset = useCallback(() => {
    stopRun();
    if (assembled) {
      const m = createMachine(assembled);
      setMachine(m);
      machineRef.current = m;
      setRunState("ready");
      refresh();
    } else {
      setMachine(null);
      machineRef.current = null;
      setRunState("idle");
      setAssemblyError(null);
      setAssemblyErrorLine(null);
      refresh();
    }
  }, [assembled, stopRun, refresh]);

  const updateRunStateFromMachine = useCallback(
    (m: Machine) => {
      if (m.err) setRunState("error");
      else if (m.halted) setRunState("halted");
      else if (m.waitingForInput) setRunState("running");
      else setRunState("ready");
      refresh();
    },
    [refresh],
  );

  const doStep = useCallback(() => {
    const m = machineRef.current;
    if (!m || m.halted || m.waitingForInput) return;
    m.step();
    updateRunStateFromMachine(m);
  }, [updateRunStateFromMachine]);

  const runBatch = useCallback(() => {
    const m = machineRef.current;
    if (!m || m.halted) {
      stopRun();
      return;
    }
    if (m.waitingForInput) return;

    let ok = true;
    for (let i = 0; i < 200 && ok; i++) {
      const line = m.getCurrentLine();
      if (line !== null && breakpointsRef.current.has(line)) {
        stopRun();
        updateRunStateFromMachine(m);
        return;
      }
      ok = m.step();
      guardRef.current++;
      if (guardRef.current > INSTRUCTION_LIMIT) {
        m.err = "Instruction limit exceeded (possible infinite loop).";
        m.halted = true;
        ok = false;
      }
    }
    updateRunStateFromMachine(m);
    if (!ok) stopRun();
  }, [stopRun, updateRunStateFromMachine]);

  const doRun = useCallback(() => {
    const m = machineRef.current;
    if (!m || m.halted) return;
    stopRun();
    setRunState("running");
    guardRef.current = 0;
    runTimerRef.current = setInterval(runBatch, runSpeed);
  }, [runBatch, runSpeed, stopRun]);

  const doPause = useCallback(() => {
    stopRun();
    if (machineRef.current && !machineRef.current.halted) {
      setRunState("ready");
      refresh();
    }
  }, [stopRun, refresh]);

  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }, []);

  const loadSample = useCallback(
    (key: SampleKey) => {
      stopRun();
      setSource(SAMPLES[key]);
      setAssembled(null);
      setMachine(null);
      machineRef.current = null;
      setRunState("idle");
      setAssemblyError(null);
      setAssemblyErrorLine(null);
      refresh();
    },
    [stopRun, refresh],
  );

  const shareLink = useCallback(() => {
    const encoded = encodeProgramToShare(source);
    const url = `${window.location.origin}/ide?p=${encoded}`;
    return url;
  }, [source]);

  const provideInput = useCallback(
    (char: string) => {
      const m = machineRef.current;
      if (!m) return;
      m.enqueueInput(char);
      m.step();
      updateRunStateFromMachine(m);
      if (runTimerRef.current && !m.halted && !m.waitingForInput) {
        runBatch();
      }
    },
    [runBatch, updateRunStateFromMachine],
  );

  useEffect(() => () => stopRun(), [stopRun]);

  return {
    source,
    setSource,
    assembled,
    machine,
    runState,
    assemblyError,
    assemblyErrorLine,
    breakpoints,
    toggleBreakpoint,
    runSpeed,
    setRunSpeed,
    theme,
    applyTheme,
    hexBase,
    setHexBase,
    tick,
    doAssemble,
    doReset,
    doStep,
    doRun,
    doPause,
    loadSample,
    shareLink,
    provideInput,
    isRunning: runState === "running",
  };
}
