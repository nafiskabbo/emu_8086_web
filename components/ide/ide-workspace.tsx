"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/ide/code-editor";
import {
  ConsolePanel,
  FlagsPanel,
  RegisterPanel,
  StatusLine,
} from "@/components/ide/cpu-panels";
import {
  DataSegmentPanel,
  HexDumpPanel,
  StackPanels,
} from "@/components/ide/memory-panels";
import { ErrorBar, ShortcutsOverlay, Toast } from "@/components/ide/overlays";
import { Toolbar } from "@/components/ide/toolbar";
import { useEmulator } from "@/lib/ide/use-emulator";

export function IdeWorkspace() {
  const emu = useEmulator();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const { machine, assembled, tick } = emu;
  void tick;

  const currentLine = machine?.getCurrentLine() ?? null;
  const runtimeError = machine?.err ?? null;
  const errorMessage =
    emu.assemblyError ??
    (runtimeError ? `Runtime error — ${runtimeError}` : null);
  const errorLine =
    emu.assemblyErrorLine ??
    (runtimeError && currentLine ? currentLine : null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleOpen = () => fileInputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      emu.setSource(String(reader.result));
      showToast(`Opened ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = () => {
    const blob = new Blob([emu.source], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code.asm";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Saved code.asm");
  };

  const handleShare = async () => {
    const url = emu.shareLink();
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied");
    } catch {
      showToast(url);
    }
  };

  const handleCopyConsole = async () => {
    const text = machine?.output ?? "";
    try {
      await navigator.clipboard.writeText(text);
      showToast("Console copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const jumpToError = () => {
    if (errorLine && editorWrapRef.current) {
      const ta = editorWrapRef.current.querySelector("textarea");
      if (ta) {
        const lines = emu.source.split("\n");
        let pos = 0;
        for (let i = 0; i < errorLine - 1; i++) pos += lines[i].length + 1;
        ta.focus();
        ta.setSelectionRange(pos, pos + (lines[errorLine - 1]?.length ?? 0));
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setShowShortcuts(true);
        }
        return;
      }
      if (e.key === "F5") {
        e.preventDefault();
        emu.doAssemble();
      } else if (e.key === "F8") {
        e.preventDefault();
        emu.doStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        emu.doPause();
      } else if (e.key === "?") {
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emu]);

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-bg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".asm,.txt,text/plain"
        className="hidden"
        onChange={handleFile}
      />

      <Toolbar
        runState={emu.runState}
        canRun={!!machine && !machine.halted}
        isRunning={emu.runState === "running"}
        runSpeed={emu.runSpeed}
        theme={emu.theme}
        onAssemble={emu.doAssemble}
        onRun={emu.doRun}
        onPause={emu.doPause}
        onStep={emu.doStep}
        onReset={emu.doReset}
        onSample={emu.loadSample}
        onOpen={handleOpen}
        onSave={handleSave}
        onShare={handleShare}
        onToggleTheme={() =>
          emu.applyTheme(emu.theme === "dark" ? "light" : "dark")
        }
        onShowShortcuts={() => setShowShortcuts(true)}
        onSpeedChange={emu.setRunSpeed}
      />

      <div className="grid min-h-0 grid-cols-1 gap-px overflow-hidden bg-line lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex min-h-0 flex-col bg-bg">
          <div className="paneltitle flex justify-between">
            <span>
              Source — <span className="text-amber">CODE.ASM</span>
            </span>
          </div>
          <div ref={editorWrapRef} className="flex min-h-0 flex-1 flex-col">
            <CodeEditor
              source={emu.source}
              onChange={emu.setSource}
              currentLine={currentLine}
              breakpoints={emu.breakpoints}
              onToggleBreakpoint={emu.toggleBreakpoint}
              errorLine={errorLine}
            />
          </div>
          <ErrorBar message={errorMessage} onJump={errorLine ? jumpToError : undefined} />
          <ConsolePanel
            machine={machine}
            waitingForInput={machine?.waitingForInput ?? false}
            onInput={emu.provideInput}
            onCopy={handleCopyConsole}
          />
        </div>

        <div className="flex min-h-0 flex-col overflow-auto bg-bg">
          <RegisterPanel machine={machine} />
          <FlagsPanel machine={machine} />
          <StatusLine machine={machine} />
          <DataSegmentPanel
            assembled={assembled}
            machine={machine}
            hexBase={emu.hexBase}
            onHexBaseChange={emu.setHexBase}
          />
          <HexDumpPanel
            assembled={assembled}
            machine={machine}
            hexBase={emu.hexBase}
            onHexBaseChange={emu.setHexBase}
          />
          <StackPanels machine={machine} />
        </div>
      </div>

      <ShortcutsOverlay
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
      <Toast message={toast} />
    </div>
  );
}
