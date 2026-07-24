"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Extra class on the panel (width etc.) */
  panelClassName?: string;
  footer?: ReactNode;
  /** Accessibility label */
  ariaLabel?: string;
}

/** Shared modal: top-right close, Esc, backdrop click. */
export function DialogShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  panelClassName = "max-w-lg",
  footer,
  ariaLabel,
}: DialogShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
    >
      <div
        className={`max-h-[90dvh] w-full overflow-auto border border-line bg-panel p-4 shadow-2xl sm:p-6 ${panelClassName}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-ink-dim">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-icon shrink-0"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
