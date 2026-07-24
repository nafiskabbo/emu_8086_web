"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SHARE_CODE_PATTERN } from "@/lib/share/constants";

export default function ShortSharePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = String(params.code ?? "")
    .trim()
    .toLowerCase();
  const invalid = !SHARE_CODE_PATTERN.test(code);
  const [message, setMessage] = useState(
    invalid ? "Invalid share link." : "Loading shared program…",
  );

  useEffect(() => {
    if (invalid) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/share/${code}`);
        const data = (await res.json()) as { source?: string; error?: string };
        if (!res.ok || !data.source) {
          if (!cancelled) {
            setMessage(data.error || "Share not found or expired.");
          }
          return;
        }
        sessionStorage.setItem(`emu8086web:share:${code}`, data.source);
        router.replace(`/?s=${encodeURIComponent(code)}`);
      } catch {
        if (!cancelled) setMessage("Failed to load share link.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, invalid, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      <p className="font-mono text-sm text-amber">{message}</p>
      <Link href="/" className="text-xs text-ink-dim underline hover:text-amber">
        Back to IDE
      </Link>
    </div>
  );
}
