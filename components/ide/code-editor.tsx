"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  formatAsm,
  formatAsmSelection,
  indentAfterEnter,
} from "@/lib/ide/format-asm";
import type { TabSize } from "@/lib/ide/editor-prefs";
import {
  loadOverrides,
  loadScheme,
  matchShortcut,
  type OverrideMap,
  type ShortcutScheme,
} from "@/lib/ide/shortcuts";

export type CodeEditorHandle = {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

interface CodeEditorProps {
  source: string;
  onChange: (value: string) => void;
  currentLine: number | null;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
  errorLine: number | null;
  errorMessage: string | null;
  tabSize?: TabSize;
  wordWrap?: boolean;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

const LINE_H = 20;
const PAD_Y = 12;
const HISTORY_LIMIT = 200;

function selectedLineRange(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const searchFrom =
    end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nextNl = value.indexOf("\n", searchFrom);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  return { lineStart, lineEnd };
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      source,
      onChange,
      currentLine,
      breakpoints,
      onToggleBreakpoint,
      errorLine,
      errorMessage,
      tabSize = 4,
      wordWrap = false,
      onHistoryChange,
    },
    ref,
  ) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = source.split("\n").length;
  const indent = " ".repeat(tabSize);

  const historyRef = useRef<string[]>([source]);
  const histIndexRef = useRef(0);
  const applyingHistory = useRef(false);
  const lastSourceRef = useRef(source);
  const schemeRef = useRef<ShortcutScheme>(loadScheme());
  const overridesRef = useRef<OverrideMap>(loadOverrides());
  const onHistoryChangeRef = useRef(onHistoryChange);
  onHistoryChangeRef.current = onHistoryChange;

  const emitHistory = useCallback(() => {
    onHistoryChangeRef.current?.({
      canUndo: histIndexRef.current > 0,
      canRedo: histIndexRef.current < historyRef.current.length - 1,
    });
  }, []);

  useEffect(() => {
    schemeRef.current = loadScheme();
    overridesRef.current = loadOverrides();
    const onPrefs = () => {
      schemeRef.current = loadScheme();
      overridesRef.current = loadOverrides();
    };
    window.addEventListener("emu8086web:shortcuts-changed", onPrefs);
    return () =>
      window.removeEventListener("emu8086web:shortcuts-changed", onPrefs);
  }, []);

  // Reset history when file content jumps (tab switch / sample load)
  useEffect(() => {
    if (applyingHistory.current) {
      applyingHistory.current = false;
      lastSourceRef.current = source;
      emitHistory();
      return;
    }
    if (source !== lastSourceRef.current) {
      const hist = historyRef.current;
      const idx = histIndexRef.current;
      // External change not from our undo/redo
      if (hist[idx] !== source) {
        historyRef.current = [source];
        histIndexRef.current = 0;
      }
      lastSourceRef.current = source;
      emitHistory();
    }
  }, [source, emitHistory]);

  const pushHistory = useCallback(
    (next: string) => {
      if (next === historyRef.current[histIndexRef.current]) return;
      const trimmed = historyRef.current.slice(0, histIndexRef.current + 1);
      trimmed.push(next);
      if (trimmed.length > HISTORY_LIMIT) trimmed.shift();
      historyRef.current = trimmed;
      histIndexRef.current = trimmed.length - 1;
      emitHistory();
    },
    [emitHistory],
  );

  const commit = useCallback(
    (next: string, selection?: { start: number; end: number }) => {
      pushHistory(next);
      onChange(next);
      lastSourceRef.current = next;
      if (selection) {
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (!ta) return;
          ta.selectionStart = selection.start;
          ta.selectionEnd = selection.end;
        });
      }
    },
    [onChange, pushHistory],
  );

  const undo = useCallback(() => {
    if (histIndexRef.current <= 0) return;
    histIndexRef.current -= 1;
    applyingHistory.current = true;
    const prev = historyRef.current[histIndexRef.current] ?? "";
    onChange(prev);
    lastSourceRef.current = prev;
    emitHistory();
  }, [onChange, emitHistory]);

  const redo = useCallback(() => {
    if (histIndexRef.current >= historyRef.current.length - 1) return;
    histIndexRef.current += 1;
    applyingHistory.current = true;
    const next = historyRef.current[histIndexRef.current] ?? "";
    onChange(next);
    lastSourceRef.current = next;
    emitHistory();
  }, [onChange, emitHistory]);

  useImperativeHandle(
    ref,
    () => ({
      undo,
      redo,
      canUndo: () => histIndexRef.current > 0,
      canRedo: () => histIndexRef.current < historyRef.current.length - 1,
    }),
    [undo, redo],
  );

  useEffect(() => {
    emitHistory();
  }, [emitHistory]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    if (ta) setScrollTop(ta.scrollTop);
    if (ta && gutter) gutter.scrollTop = ta.scrollTop;
  }, []);

  useEffect(() => {
    syncScroll();
  }, [currentLine, source, errorLine, syncScroll]);

  useEffect(() => {
    if (errorLine && textareaRef.current) {
      const y = (errorLine - 1) * LINE_H;
      textareaRef.current.scrollTop = Math.max(0, y - 80);
      syncScroll();
    }
  }, [errorLine, syncScroll]);

  const shortErr = errorMessage
    ?.replace(/^Runtime error — /i, "")
    .replace(/^Assembly error — /i, "");

  const match = useCallback(
    (e: KeyboardEvent, id: Parameters<typeof matchShortcut>[1]) =>
      matchShortcut(e, id, schemeRef.current, overridesRef.current),
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (match(e, "undo")) {
        e.preventDefault();
        undo();
        return;
      }
      if (match(e, "redo")) {
        e.preventDefault();
        redo();
        return;
      }

      if (match(e, "formatDocument")) {
        e.preventDefault();
        const formatted = formatAsm(source, tabSize);
        if (formatted !== source) {
          const ta = e.currentTarget;
          commit(formatted, {
            start: Math.min(ta.selectionStart, formatted.length),
            end: Math.min(ta.selectionEnd, formatted.length),
          });
        }
        return;
      }

      if (match(e, "formatSelection")) {
        e.preventDefault();
        const ta = e.currentTarget;
        const { next, start, end } = formatAsmSelection(
          source,
          ta.selectionStart,
          ta.selectionEnd,
          tabSize,
        );
        if (next !== source) commit(next, { start, end });
        return;
      }

      if (match(e, "duplicateLine")) {
        e.preventDefault();
        const ta = e.currentTarget;
        const { lineStart, lineEnd } = selectedLineRange(
          source,
          ta.selectionStart,
          ta.selectionEnd,
        );
        const block = source.slice(lineStart, lineEnd);
        const withDup =
          source.slice(0, lineEnd) + "\n" + block + source.slice(lineEnd);
        commit(withDup, {
          start: lineEnd + 1,
          end: lineEnd + 1 + block.length,
        });
        return;
      }

      if (match(e, "deleteLine")) {
        e.preventDefault();
        const ta = e.currentTarget;
        const { lineStart, lineEnd } = selectedLineRange(
          source,
          ta.selectionStart,
          ta.selectionEnd,
        );
        let cutStart = lineStart;
        let cutEnd = lineEnd;
        if (cutEnd < source.length && source[cutEnd] === "\n") {
          cutEnd += 1;
        } else if (cutStart > 0) {
          cutStart -= 1;
        }
        const next = source.slice(0, cutStart) + source.slice(cutEnd);
        commit(next, { start: cutStart, end: cutStart });
        return;
      }

      if (match(e, "moveLineUp") || match(e, "moveLineDown")) {
        e.preventDefault();
        const down = match(e, "moveLineDown");
        const ta = e.currentTarget;
        const { lineStart, lineEnd } = selectedLineRange(
          source,
          ta.selectionStart,
          ta.selectionEnd,
        );
        const lines = source.split("\n");
        const startIdx = source.slice(0, lineStart).split("\n").length - 1;
        const endIdx = source.slice(0, lineEnd).split("\n").length - 1;
        if (!down && startIdx <= 0) return;
        if (down && endIdx >= lines.length - 1) return;
        const chunk = lines.splice(startIdx, endIdx - startIdx + 1);
        const insertAt = down ? startIdx + 1 : startIdx - 1;
        lines.splice(insertAt, 0, ...chunk);
        const joined = lines.join("\n");
        const prefix = lines.slice(0, insertAt).join("\n");
        const newStart = prefix.length + (insertAt > 0 ? 1 : 0);
        const newEnd = newStart + chunk.join("\n").length;
        commit(joined, { start: newStart, end: newEnd });
        return;
      }

      if (match(e, "toggleComment")) {
        e.preventDefault();
        const ta = e.currentTarget;
        const { lineStart, lineEnd } = selectedLineRange(
          source,
          ta.selectionStart,
          ta.selectionEnd,
        );
        const block = source.slice(lineStart, lineEnd);
        const lines = block.split("\n");
        const allCommented = lines.every(
          (l) => !l.trim() || /^\s*;/.test(l),
        );
        const nextLines = lines.map((l) => {
          if (!l.trim()) return l;
          if (allCommented) return l.replace(/^(\s*); ?/, "$1");
          const m = l.match(/^(\s*)/);
          return `${m?.[1] ?? ""}; ${l.slice(m?.[1]?.length ?? 0)}`;
        });
        const nextBlock = nextLines.join("\n");
        const next =
          source.slice(0, lineStart) + nextBlock + source.slice(lineEnd);
        commit(next, {
          start: lineStart,
          end: lineStart + nextBlock.length,
        });
        return;
      }

      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const ta = e.currentTarget;
        const { selectionStart, selectionEnd, value } = ta;
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        const prevLine = value.slice(lineStart, selectionStart);
        const nextIndent = indentAfterEnter(prevLine, tabSize);
        const insert = `\n${nextIndent}`;
        const next =
          value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
        commit(next, {
          start: selectionStart + insert.length,
          end: selectionStart + insert.length,
        });
        return;
      }

      if (e.key !== "Tab") return;

      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart, selectionEnd, value } = ta;

      if (selectionStart !== selectionEnd || e.shiftKey) {
        const { lineStart, lineEnd } = selectedLineRange(
          value,
          selectionStart,
          selectionEnd,
        );
        const block = value.slice(lineStart, lineEnd);
        const lines = block.split("\n");

        if (e.shiftKey) {
          let removedFirst = 0;
          let removedTotal = 0;
          const outdentRe = new RegExp(`^ {1,${tabSize}}`);
          const outdented = lines.map((line, i) => {
            const matchLine = line.match(outdentRe);
            if (!matchLine) return line;
            if (i === 0) removedFirst = matchLine[0].length;
            removedTotal += matchLine[0].length;
            return line.slice(matchLine[0].length);
          });
          const next =
            value.slice(0, lineStart) +
            outdented.join("\n") +
            value.slice(lineEnd);
          commit(next, {
            start: Math.max(lineStart, selectionStart - removedFirst),
            end: Math.max(
              Math.max(lineStart, selectionStart - removedFirst),
              selectionEnd - removedTotal,
            ),
          });
          return;
        }

        const indented = lines.map((line) => indent + line).join("\n");
        const next =
          value.slice(0, lineStart) + indented + value.slice(lineEnd);
        commit(next, {
          start: selectionStart + indent.length,
          end: selectionEnd + indent.length * lines.length,
        });
        return;
      }

      const next =
        value.slice(0, selectionStart) + indent + value.slice(selectionEnd);
      commit(next, {
        start: selectionStart + indent.length,
        end: selectionStart + indent.length,
      });
    },
    [commit, indent, match, redo, source, tabSize, undo],
  );

  const onInputChange = (value: string) => {
    pushHistory(value);
    onChange(value);
    lastSourceRef.current = value;
  };

  return (
    <div className="editor-wrap relative flex min-h-0 flex-1 overflow-hidden bg-bg">
      <div
        ref={gutterRef}
        className="gutter w-12 shrink-0 overflow-hidden border-r border-line bg-[var(--gutter-bg)] py-3 pr-1.5 text-right font-mono text-[13px] leading-5 text-ink-dim select-none"
        aria-hidden
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const line = i + 1;
          const isCurrent = line === currentLine;
          const isBp = breakpoints.has(line);
          const isErr = line === errorLine;
          return (
            <div
              key={line}
              className={`relative h-5 cursor-pointer px-1 hover:text-amber ${
                isErr ? "font-semibold text-red underline decoration-red" : ""
              }`}
              onClick={() => onToggleBreakpoint(line)}
              title={
                isErr
                  ? shortErr ?? "Error on this line"
                  : isBp
                    ? "Remove breakpoint"
                    : "Set breakpoint"
              }
            >
              {isBp && (
                <span className="absolute top-0 left-0.5 text-[10px] text-red">
                  ●
                </span>
              )}
              {isErr ? "!" : isCurrent ? "▶" : line}
            </div>
          );
        })}
      </div>

      <div className="relative min-h-0 min-w-0 flex-1">
        {currentLine !== null && (
          <div
            className="pointer-events-none absolute right-0 left-0 z-[1] border-y border-[var(--highlight-border)] bg-[var(--highlight)]"
            style={{
              top: PAD_Y + (currentLine - 1) * LINE_H - scrollTop,
              height: LINE_H,
            }}
          />
        )}
        {errorLine !== null && (
          <div
            className="pointer-events-none absolute right-0 left-0 z-[2] border-y-2 border-red bg-[var(--error-line)]"
            style={{
              top: PAD_Y + (errorLine - 1) * LINE_H - scrollTop,
              height: LINE_H,
            }}
          />
        )}

        <textarea
          ref={textareaRef}
          value={source}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          wrap={wordWrap ? "soft" : "off"}
          className={`relative z-[3] h-full min-h-0 w-full resize-none border-none bg-transparent px-3.5 py-3 font-mono text-[13px] leading-5 text-ink caret-amber outline-none ${
            wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
          }`}
          style={{ tabSize }}
          aria-label="Assembly source code"
        />

        {errorLine !== null && shortErr && (
          <div
            className="pointer-events-none absolute right-2 left-2 z-[4] truncate rounded border border-[var(--error-border)] bg-[var(--error-bg)] px-2 py-1 font-mono text-[11px] text-red shadow-md"
            style={{
              top: PAD_Y + errorLine * LINE_H - scrollTop + 2,
            }}
            title={shortErr}
          >
            ✕ {shortErr}
          </div>
        )}
      </div>
    </div>
  );
  },
);
