"use client";

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "F5", action: "Compile / Assemble" },
  { key: "F8", action: "Single step" },
  { key: "Esc", action: "Pause execution" },
  { key: "?", action: "Show this help" },
];

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-sm border border-line bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
          Keyboard shortcuts
        </h2>
        <ul className="mt-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.key} className="flex justify-between text-sm text-ink">
              <kbd className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-xs">
                {s.key}
              </kbd>
              <span className="text-ink-dim">{s.action}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn mt-6 w-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

interface ErrorBarProps {
  message: string | null;
  onJump?: () => void;
}

export function ErrorBar({ message, onJump }: ErrorBarProps) {
  if (!message) return null;
  return (
    <div
      className={`shrink-0 border-t border-[var(--error-border)] bg-[var(--error-bg)] px-3.5 py-2 text-xs text-red ${
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
      ✕ {message}
      {onJump && (
        <span className="ml-3 underline decoration-red/60">Jump to line</span>
      )}
    </div>
  );
}

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-line bg-panel px-4 py-2 font-mono text-xs text-green shadow-lg">
      {message}
    </div>
  );
}
