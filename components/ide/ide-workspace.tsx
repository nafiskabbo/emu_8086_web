"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdSenseAnchor, AdSenseUnit, AD_SLOTS } from "@/components/ads/adsense-unit";
import { CodeEditor } from "@/components/ide/code-editor";
import {
  ConsolePanel,
  FlagsPanel,
  RegisterPanel,
  StatusLine,
} from "@/components/ide/cpu-panels";
import { FileTabs } from "@/components/ide/file-tabs";
import { OPEN_HELP_EVENT } from "@/components/ide/help-menu";
import {
  DataSegmentPanel,
  HexDumpPanel,
  StackPanels,
} from "@/components/ide/memory-panels";
import { ErrorBar, Toast } from "@/components/ide/overlays";
import { ResizeHandle } from "@/components/ide/resize-panels";
import { SettingsModal } from "@/components/ide/settings-modal";
import { Toolbar } from "@/components/ide/toolbar";
import { useEmulator } from "@/lib/ide/use-emulator";
import {
  applyAccent,
  FONT_SCALE_KEY,
  loadAccent,
  loadTabSize,
  loadWordWrap,
  TAB_SIZE_KEY,
  type TabSize,
  WORD_WRAP_KEY,
} from "@/lib/ide/editor-prefs";
import {
  createDefaultFile,
  createFileId,
  ensureAsmExtension,
  loadFilesFromStorage,
  saveFilesToStorage,
  type WorkspaceFile,
} from "@/lib/ide/workspace-files";
import type { SampleKey } from "@/lib/emulator";
import { SAMPLES } from "@/lib/emulator";
import {
  clearShareQueryFromUrl,
  takeSharedSourceFromUrl,
} from "@/lib/ide/share-boot";
import {
  loadOverrides,
  loadScheme,
  matchShortcut,
} from "@/lib/ide/shortcuts";

export function IdeWorkspace() {
  const [files, setFiles] = useState<WorkspaceFile[]>(() => [createDefaultFile()]);
  const [activeId, setActiveId] = useState(() => files[0]?.id ?? "");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [leftPct, setLeftPct] = useState(58);
  const [editorPct, setEditorPct] = useState(58);
  const [cpuCollapsed, setCpuCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabSize, setTabSize] = useState<TabSize>(4);
  const [wordWrap, setWordWrap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => files.find((f) => f.id === activeId) ?? null,
    [files, activeId],
  );
  const hasFiles = files.length > 0;

  const emu = useEmulator(active?.content);

  const lastSynced = useRef<string | null>(null);
  useEffect(() => {
    if (!active) {
      lastSynced.current = null;
      return;
    }
    if (lastSynced.current === active.id) return;
    lastSynced.current = active.id;
    emu.setSource(active.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tab switch sync
  }, [active?.id]);

  useEffect(() => {
    const sharedSource = takeSharedSourceFromUrl();

    if (sharedSource) {
      const file = createDefaultFile("shared.asm");
      file.content = sharedSource;
      queueMicrotask(() => {
        setFiles([file]);
        setActiveId(file.id);
        lastSynced.current = file.id;
        emu.setSource(sharedSource);
        clearShareQueryFromUrl();
        setHydrated(true);
      });
      return;
    }

    const stored = loadFilesFromStorage();
    queueMicrotask(() => {
      if (stored) {
        setFiles(stored.files);
        setActiveId(stored.activeId);
        lastSynced.current = null;
      }
      setHydrated(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setTabSize(loadTabSize());
      setWordWrap(loadWordWrap());
      const scale = localStorage.getItem(FONT_SCALE_KEY);
      if (scale) {
        document.documentElement.style.fontSize = `${Number(scale) || 100}%`;
      }
      applyAccent(loadAccent(), emu.theme);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs once on mount
  }, []);

  useEffect(() => {
    applyAccent(loadAccent(), emu.theme);
  }, [emu.theme]);

  useEffect(() => {
    if (!hydrated) return;
    saveFilesToStorage(files, activeId);
  }, [files, activeId, hydrated]);

  const persistTabSize = useCallback((size: TabSize) => {
    setTabSize(size);
    localStorage.setItem(TAB_SIZE_KEY, String(size));
  }, []);

  const persistWordWrap = useCallback((wrap: boolean) => {
    setWordWrap(wrap);
    localStorage.setItem(WORD_WRAP_KEY, wrap ? "1" : "0");
  }, []);

  const { machine, assembled, tick } = emu;
  void tick;

  const currentLine = machine?.getCurrentLine() ?? null;
  const runtimeError = machine?.err ?? null;
  const errorMessage =
    emu.assemblyError != null
      ? `Assembly error — ${emu.assemblyError}`
      : runtimeError
        ? `Runtime error — ${runtimeError}`
        : null;
  const errorLine =
    emu.assemblyErrorLine ?? machine?.getErrorLine() ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const updateActiveContent = (content: string) => {
    if (!activeId) return;
    emu.setSource(content);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeId ? { ...f, content, dirty: true } : f,
      ),
    );
  };

  const selectFile = (id: string) => {
    setFiles((prev) => {
      const flushed = prev.map((f) =>
        f.id === activeId ? { ...f, content: emu.source } : f,
      );
      const next = flushed.find((f) => f.id === id);
      if (next) queueMicrotask(() => emu.setSource(next.content));
      return flushed;
    });
    setActiveId(id);
    lastSynced.current = id;
  };

  const newFile = () => {
    const name = ensureAsmExtension(
      window.prompt("New file name", `untitled${files.length + 1}.asm`) ??
        `untitled${files.length + 1}.asm`,
    );
    const file = createDefaultFile(name);
    file.content = `; ${name}\n.model small\n.stack 100h\n.data\n.code\nmain proc\n    mov ah, 4ch\n    int 21h\nmain endp\nend main\n`;
    setFiles((prev) => {
      const flushed = prev.map((f) =>
        f.id === activeId ? { ...f, content: emu.source } : f,
      );
      return [...flushed, file];
    });
    setActiveId(file.id);
    lastSynced.current = null;
  };

  const closeFile = (id: string) => {
    const idx = files.findIndex((f) => f.id === id);
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    if (next.length === 0) {
      setActiveId("");
      lastSynced.current = null;
      emu.setSource("");
      return;
    }
    if (activeId === id) {
      const fallback = next[Math.max(0, idx - 1)] ?? next[0];
      setActiveId(fallback.id);
      lastSynced.current = null;
    }
  };

  const renameFile = (id: string, name: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: ensureAsmExtension(name), dirty: true } : f,
      ),
    );
  };

  const handleOpen = () => fileInputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const readers = Array.from(list).map(
      (file) =>
        new Promise<WorkspaceFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: createFileId(),
              name: ensureAsmExtension(file.name),
              content: String(reader.result),
              dirty: false,
            });
          };
          reader.readAsText(file);
        }),
    );
    void Promise.all(readers).then((opened) => {
      setFiles((prev) => {
        const flushed = prev.map((f) =>
          f.id === activeId ? { ...f, content: emu.source } : f,
        );
        return [...flushed, ...opened];
      });
      setActiveId(opened[opened.length - 1].id);
      lastSynced.current = null;
      showToast(`Opened ${opened.length} file(s)`);
    });
    e.target.value = "";
  };

  const downloadFile = (name: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ensureAsmExtension(name);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!active) {
      showToast("No file open");
      return;
    }
    downloadFile(active.name, emu.source);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeId ? { ...f, content: emu.source, dirty: false } : f,
      ),
    );
    showToast(`Saved ${active.name}`);
  };

  const handleSaveAs = () => {
    if (!active) {
      showToast("No file open");
      return;
    }
    const name = window.prompt("Save as filename", active.name);
    if (!name) return;
    const finalName = ensureAsmExtension(name);
    downloadFile(finalName, emu.source);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeId
          ? { ...f, name: finalName, content: emu.source, dirty: false }
          : f,
      ),
    );
    showToast(`Saved ${finalName}`);
  };

  const handleShare = async () => {
    const url = emu.shareLink();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("clipboard unavailable");
      }
      showToast("Share link copied");
    } catch {
      window.prompt("Copy this share link:", url);
      showToast("Share link ready");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(emu.source);
      showToast("Code copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const handleCopyConsole = async () => {
    try {
      await navigator.clipboard.writeText(machine?.output ?? "");
      showToast("Console copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const loadSample = (key: SampleKey) => {
    if (!hasFiles) {
      const file = createDefaultFile("main.asm");
      file.content = SAMPLES[key];
      setFiles([file]);
      setActiveId(file.id);
      lastSynced.current = null;
    } else {
      updateActiveContent(SAMPLES[key]);
    }
    showToast(`Loaded sample: ${key}`);
  };

  const jumpToError = useCallback(() => {
    if (!errorLine || !editorWrapRef.current) return;
    const ta = editorWrapRef.current.querySelector("textarea");
    if (!ta) return;
    const lines = emu.source.split("\n");
    let pos = 0;
    for (let i = 0; i < errorLine - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1;
    }
    const lineLen = lines[errorLine - 1]?.length ?? 0;
    ta.focus();
    ta.setSelectionRange(pos, pos + lineLen);
    ta.scrollTop = Math.max(0, (errorLine - 1) * 20 - 80);
  }, [errorLine, emu.source]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const scheme = loadScheme();
      const overrides = loadOverrides();
      const hit = (id: Parameters<typeof matchShortcut>[1]) =>
        matchShortcut(e, id, scheme, overrides);

      if (hit("save")) {
        e.preventDefault();
        handleSave();
        return;
      }

      if (
        hit("shortcuts") ||
        (e.key === "?" &&
          !e.ctrlKey &&
          !e.metaKey &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLInputElement))
      ) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent(OPEN_HELP_EVENT, {
            detail: { panel: "shortcuts" },
          }),
        );
        return;
      }

      if (hit("ascii")) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent(OPEN_HELP_EVENT, {
            detail: { panel: "ascii" },
          }),
        );
        return;
      }

      if (hit("convert")) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent(OPEN_HELP_EVENT, {
            detail: { panel: "convert" },
          }),
        );
        return;
      }

      if (hit("assemble")) {
        e.preventDefault();
        if (hasFiles) emu.doAssemble();
        return;
      }
      if (hit("step")) {
        e.preventDefault();
        emu.doStep();
        return;
      }

      const inField =
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement;

      if (inField) return;

      if (e.key === "Escape" && !settingsOpen) {
        const openDialog = document.querySelector(
          '[role="dialog"][aria-modal="true"]',
        );
        if (openDialog) return;
        e.preventDefault();
        emu.doPause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onHorizontalDrag = useCallback((delta: number) => {
    const width = splitRef.current?.clientWidth ?? window.innerWidth;
    setLeftPct((p) => Math.min(78, Math.max(28, p + (delta / width) * 100)));
  }, []);

  const onVerticalDrag = useCallback((delta: number) => {
    const col = editorWrapRef.current?.parentElement;
    const height = col?.clientHeight ?? 400;
    setEditorPct((p) => Math.min(82, Math.max(22, p + (delta / height) * 100)));
  }, []);

  return (
    <div
      className="grid h-dvh max-h-dvh grid-rows-[auto_auto_1fr] overflow-hidden bg-bg"
      style={{ paddingBottom: "var(--ad-anchor-pad, 0px)" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".asm,.txt,.inc,text/plain"
        className="hidden"
        multiple
        onChange={handleFile}
      />

      <Toolbar
        runState={emu.runState}
        canRun={hasFiles && !!machine && !machine.halted}
        isRunning={emu.runState === "running"}
        runSpeed={emu.runSpeed}
        theme={emu.theme}
        fileName={active?.name ?? ""}
        onAssemble={() => {
          if (!hasFiles) {
            showToast("Open or create a file first");
            return;
          }
          emu.doAssemble();
        }}
        onRun={emu.doRun}
        onPause={emu.doPause}
        onStep={emu.doStep}
        onReset={emu.doReset}
        onSample={loadSample}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onShare={handleShare}
        onToggleTheme={() =>
          emu.applyTheme(emu.theme === "dark" ? "light" : "dark")
        }
        onSpeedChange={emu.setRunSpeed}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <FileTabs
        files={files}
        activeId={activeId}
        onSelect={selectFile}
        onClose={closeFile}
        onNew={newFile}
        onRename={renameFile}
      />

      {!hasFiles ? (
        <div className="flex min-h-0 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="font-mono text-lg text-amber">No file open</p>
          <p className="max-w-sm text-sm text-ink-dim">
            Create a new assembly file or open an existing `.asm` to start
            coding.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={newFile}>
              New file
            </button>
            <button type="button" className="btn" onClick={handleOpen}>
              Open file…
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={splitRef}
          className="flex min-h-0 flex-col overflow-hidden lg:flex-row"
        >
          <div
            className="flex min-h-0 min-w-0 flex-col bg-bg"
            style={{
              flex: `0 0 ${leftPct}%`,
              maxWidth: "100%",
            }}
          >
            <div
              ref={editorWrapRef}
              className="flex min-h-0 flex-col overflow-hidden"
              style={{ flex: `0 0 ${editorPct}%` }}
            >
              <div className="paneltitle flex shrink-0 items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <span className="truncate">
                    Source —{" "}
                    <span className="text-amber">{active?.name ?? "CODE.ASM"}</span>
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] tracking-wide text-ink-dim uppercase hover:border-amber hover:text-amber"
                    onClick={handleCopyCode}
                    title="Copy source code"
                  >
                    Copy
                  </button>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-[10px] text-ink-dim hover:text-amber lg:hidden"
                  onClick={() => setCpuCollapsed((c) => !c)}
                >
                  {cpuCollapsed ? "Show CPU" : "Hide CPU"}
                </button>
              </div>
              <CodeEditor
                source={emu.source}
                onChange={updateActiveContent}
                currentLine={currentLine}
                breakpoints={emu.breakpoints}
                onToggleBreakpoint={emu.toggleBreakpoint}
                errorLine={errorLine}
                errorMessage={errorMessage}
                tabSize={tabSize}
                wordWrap={wordWrap}
              />
              <ErrorBar
                message={errorMessage}
                onJump={errorLine ? jumpToError : undefined}
                source={emu.source}
                errorLine={errorLine}
              />
            </div>

            <ResizeHandle direction="vertical" onDrag={onVerticalDrag} />

            <div className="mt-1 flex min-h-[120px] flex-1 flex-col overflow-hidden border-t border-line/40 pt-1">
              <ConsolePanel
                machine={machine}
                waitingForInput={machine?.waitingForInput ?? false}
                onInput={emu.provideInput}
                onCopy={handleCopyConsole}
                theme={emu.theme}
              />
            </div>
          </div>

          <div className="hidden lg:flex">
            <ResizeHandle direction="horizontal" onDrag={onHorizontalDrag} />
          </div>

          <div
            className={`min-h-0 min-w-0 overflow-auto bg-bg ${
              cpuCollapsed
                ? "hidden lg:block"
                : "block max-h-[42vh] lg:max-h-none"
            }`}
            style={{ flex: "1 1 auto" }}
          >
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
            <div className="mt-2 hidden border-t border-line px-2 py-2 lg:block">
              <AdSenseUnit slot={AD_SLOTS.banner2} compact />
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={emu.theme}
        onThemeChange={emu.applyTheme}
        tabSize={tabSize}
        onTabSizeChange={persistTabSize}
        wordWrap={wordWrap}
        onWordWrapChange={persistWordWrap}
      />
      <AdSenseAnchor slot={AD_SLOTS.banner1} />
      <Toast message={toast} />
    </div>
  );
}
