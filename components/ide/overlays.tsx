"use client";

import { useState, type MouseEvent } from "react";
import { IconCopy } from "@/components/ide/editor-icons";
import { buildErrorClipboardText } from "@/lib/ide/copy-error-context";

interface ErrorBarProps {
  message: string | null;
  onJump?: () => void;
  source?: string;
  errorLine?: number | null;
}

export function ErrorBar({
  message,
  onJump,
  source = "",
  errorLine = null,
}: ErrorBarProps) {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const copyError = async (e: MouseEvent) => {
    e.stopPropagation();
    const text = buildErrorClipboardText({
      message,
      line: errorLine,
      source,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--error-border)] bg-[var(--error-bg)] px-3.5 py-2 text-xs text-red ${
        onJump ? "cursor-pointer hover:brightness-110" : ""
      }`}
      role={onJump ? "button" : undefined}
      tabIndex={onJump ? 0 : undefined}
      onClick={onJump}
      onKeyDown={
        onJump
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onJump();
              }
            }
          : undefined
      }
      title={onJump ? "Click to jump to error line" : undefined}
    >
      <span className="min-w-0 flex-1 break-words">✕ {message}</span>
      <span className="flex shrink-0 items-center gap-3">
        {onJump && (
          <span className="underline decoration-red/60">Jump to line</span>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 underline decoration-red/60 hover:text-ink"
          onClick={copyError}
          title="Copy error with source context for AI assistants"
        >
          <IconCopy className="h-3 w-3" />
          {copied ? "Copied!" : "Copy error"}
        </button>
      </span>
    </div>
  );
}

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 border border-line bg-panel px-4 py-2 font-mono text-xs text-green shadow-lg">
      {message}
    </div>
  );
}
