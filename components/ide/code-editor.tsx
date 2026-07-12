"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

interface CodeEditorProps {
  source: string;
  onChange: (value: string) => void;
  currentLine: number | null;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
  errorLine: number | null;
  errorMessage: string | null;
}

const LINE_H = 20;
const PAD_Y = 12;
const INDENT = "    ";

/** Inclusive line-block bounds covering the current selection. */
function selectedLineRange(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const searchFrom =
    end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nextNl = value.indexOf("\n", searchFrom);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  return { lineStart, lineEnd };
}

export function CodeEditor({
  source,
  onChange,
  currentLine,
  breakpoints,
  onToggleBreakpoint,
  errorLine,
  errorMessage,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = source.split("\n").length;

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;

      // Keep focus in the editor; insert/outdent instead of cycling panels
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
          const outdented = lines.map((line, i) => {
            const match = line.match(/^ {1,4}/);
            if (!match) return line;
            if (i === 0) removedFirst = match[0].length;
            removedTotal += match[0].length;
            return line.slice(match[0].length);
          });
          onChange(
            value.slice(0, lineStart) +
              outdented.join("\n") +
              value.slice(lineEnd),
          );
          requestAnimationFrame(() => {
            ta.selectionStart = Math.max(
              lineStart,
              selectionStart - removedFirst,
            );
            ta.selectionEnd = Math.max(
              ta.selectionStart,
              selectionEnd - removedTotal,
            );
          });
          return;
        }

        const indented = lines.map((line) => INDENT + line).join("\n");
        onChange(
          value.slice(0, lineStart) + indented + value.slice(lineEnd),
        );
        requestAnimationFrame(() => {
          ta.selectionStart = selectionStart + INDENT.length;
          ta.selectionEnd =
            selectionEnd + INDENT.length * lines.length;
        });
        return;
      }

      onChange(
        value.slice(0, selectionStart) +
          INDENT +
          value.slice(selectionEnd),
      );
      requestAnimationFrame(() => {
        const pos = selectionStart + INDENT.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      });
    },
    [onChange],
  );

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
        {/* Highlights sit under transparent textarea */}
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
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          className="relative z-[3] h-full min-h-0 w-full resize-none border-none bg-transparent px-3.5 py-3 font-mono text-[13px] leading-5 text-ink caret-amber outline-none"
          style={{ tabSize: 4 }}
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
}
