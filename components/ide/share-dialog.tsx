"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { DialogShell } from "@/components/ide/dialog-shell";
import {
  SHARE_TTL_DAYS,
  type ShareTtlDays,
} from "@/lib/share/constants";

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  source: string;
  onToast: (message: string) => void;
};

type CreateResult = {
  code: string;
  url: string;
  expiresAt: string;
  ttlDays: number;
  reused?: boolean;
};

function ShareDialogBody({
  source,
  onClose,
  onToast,
}: {
  source: string;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [ttl, setTtl] = useState<ShareTtlDays>(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setQrDataUrl(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, expiresInDays: ttl }),
      });
      const data = (await res.json()) as CreateResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to create share link");
      }
      setResult(data);
      onToast(data.reused ? "Existing share link ready" : "Share link created");
      try {
        const url = await QRCode.toDataURL(data.url, {
          width: 192,
          margin: 2,
          color: { dark: "#111111", light: "#ffffff" },
        });
        setQrDataUrl(url);
      } catch {
        /* QR optional */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create share link");
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async () => {
    if (!result?.url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.url);
      } else {
        throw new Error("clipboard unavailable");
      }
      onToast("Share link copied");
    } catch {
      window.prompt("Copy this share link:", result.url);
      onToast("Share link ready");
    }
  };

  return (
    <DialogShell
      open
      onClose={onClose}
      title="Share program"
      subtitle="Create a short link that expires automatically. No account required."
      panelClassName="max-w-md"
      footer={
        result ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={copyUrl}>
              Copy link
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !source.trim()}
              onClick={() => void generate()}
            >
              {busy ? "Generating…" : "Generate share link"}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        )
      }
    >
      {!result ? (
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium tracking-wide text-ink-dim uppercase">
            Expires in
          </legend>
          <div className="flex flex-wrap gap-2">
            {SHARE_TTL_DAYS.map((days) => (
              <label
                key={days}
                className={`cursor-pointer rounded border px-3 py-2 font-mono text-xs ${
                  ttl === days
                    ? "border-amber bg-amber/10 text-amber"
                    : "border-line text-ink-dim hover:border-amber hover:text-amber"
                }`}
              >
                <input
                  type="radio"
                  name="share-ttl"
                  className="sr-only"
                  checked={ttl === days}
                  onChange={() => setTtl(days)}
                />
                {days} day{days === 1 ? "" : "s"}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-ink-dim">
            Max expiry is 7 days. Identical programs reuse the same short code
            while still valid.
          </p>
          {error ? (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </fieldset>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL QR
            <img
              src={qrDataUrl}
              alt="QR code for share link"
              className="h-40 w-40 shrink-0 rounded border border-line bg-white p-1"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded border border-line text-xs text-ink-dim">
              QR…
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <label className="block text-[10px] tracking-wider text-ink-dim uppercase">
              Short URL
            </label>
            <input
              readOnly
              value={result.url}
              className="w-full rounded border border-line bg-panel-2 px-2 py-2 font-mono text-xs text-ink"
              onFocus={(e) => e.target.select()}
            />
            <p className="text-[11px] text-ink-dim">
              Expires{" "}
              <span className="text-ink">
                {new Date(result.expiresAt).toLocaleString()}
              </span>{" "}
              ({result.ttlDays} day{result.ttlDays === 1 ? "" : "s"})
            </p>
            <p className="break-all font-mono text-[10px] text-ink-dim">
              Code: {result.code}
            </p>
          </div>
        </div>
      )}
    </DialogShell>
  );
}

export function ShareDialog({
  open,
  onClose,
  source,
  onToast,
}: ShareDialogProps) {
  if (!open) return null;
  return (
    <ShareDialogBody source={source} onClose={onClose} onToast={onToast} />
  );
}
