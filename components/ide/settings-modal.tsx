"use client";

import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/emulator";
import { APP_AUTHOR, APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/version";

type Theme = "dark" | "light";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function SettingsModal({
  open,
  onClose,
  theme,
  onThemeChange,
}: SettingsModalProps) {
  const [fontScale, setFontScale] = useState(100);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const scale = localStorage.getItem("emu8086web:fontScale");
    queueMicrotask(() => {
      if (scale) setFontScale(Number(scale) || 100);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    localStorage.setItem("emu8086web:fontScale", String(fontScale));
    document.documentElement.style.fontSize = `${fontScale}%`;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-auto border border-line bg-panel p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-mono text-sm font-semibold tracking-wider text-amber uppercase">
              Settings
            </h2>
            <p className="mt-1 text-xs text-ink-dim">{APP_TAGLINE}</p>
          </div>
          <button
            type="button"
            className="btn btn-icon"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <section className="mt-6 space-y-5">
          <div>
            <label className="block text-xs tracking-wider text-ink-dim uppercase">
              Theme
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={`btn ${theme === "dark" ? "btn-primary" : ""}`}
                onClick={() => {
                  onThemeChange("dark");
                  localStorage.setItem(THEME_KEY, "dark");
                }}
              >
                Dark
              </button>
              <button
                type="button"
                className={`btn ${theme === "light" ? "btn-primary" : ""}`}
                onClick={() => {
                  onThemeChange("light");
                  localStorage.setItem(THEME_KEY, "light");
                }}
              >
                Light
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-wider text-ink-dim uppercase">
              UI scale ({fontScale}%)
            </label>
            <input
              type="range"
              min={85}
              max={125}
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="mt-2 w-full accent-amber"
            />
          </div>

          <button type="button" className="btn btn-primary w-full" onClick={save}>
            Save settings
          </button>
          {saved && <p className="text-sm text-green">Settings saved.</p>}
        </section>

        <section className="mt-8 border-t border-line pt-5">
          <h3 className="font-mono text-xs tracking-wider text-amber uppercase">
            About
          </h3>
          <p className="mt-2 text-sm text-ink">
            {APP_NAME} v{APP_VERSION}
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            Developed by {APP_AUTHOR.name}.
          </p>
        </section>
      </div>
    </div>
  );
}
