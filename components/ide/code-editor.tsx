"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CodeEditorProps {
  source: string;
  onChange: (value: string) => void;
  currentLine: number | null;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
  errorLine: number | null;
}

export function CodeEditor({
  source,
  onChange,
  currentLine,
  breakpoints,
  onToggleBreakpoint,
  errorLine,
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
  }, [currentLine, source, syncScroll]);

  const handleGutterClick = (line: number) => {
    onToggleBreakpoint(line);
  };

  return (
    <div className="editor-wrap relative flex min-h-0 flex-1 bg-bg">
      <div
        ref={gutterRef}
        className="gutter w-11 shrink-0 overflow-hidden border-r border-line bg-[var(--gutter-bg)] py-3 pr-1.5 text-right font-mono text-[13px] leading-5 text-ink-dim select-none"
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
              className={`relative cursor-pointer px-1 hover:text-amber ${isErr ? "text-red" : ""}`}
              onClick={() => handleGutterClick(line)}
              title={isBp ? "Remove breakpoint" : "Set breakpoint"}
            >
              {isBp && (
                <span className="absolute left-0.5 text-red">●</span>
              )}
              {isCurrent ? "▶" : line}
            </div>
          );
        })}
      </div>

      {currentLine !== null && (
        <div
          className="pointer-events-none absolute right-0 left-11 z-0 border-y border-[var(--highlight-border)] bg-[var(--highlight)]"
          style={{
            top: 12 + (currentLine - 1) * 20 - scrollTop,
            height: 20,
          }}
        />
      )}

      <textarea
        ref={textareaRef}
        value={source}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        className="relative z-10 min-h-0 flex-1 resize-none border-none bg-transparent px-3.5 py-3 font-mono text-[13px] leading-5 text-ink outline-none"
        style={{ tabSize: 4 }}
        aria-label="Assembly source code"
      />
    </div>
  );
}
