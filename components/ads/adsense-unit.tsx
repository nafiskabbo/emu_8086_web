"use client";

import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/adsense";

export { ADSENSE_CLIENT, AD_SLOTS } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdSenseUnitProps {
  slot: string;
  className?: string;
  compact?: boolean;
  onFilledChange?: (filled: boolean) => void;
}

type FillState = "pending" | "filled" | "empty";

export function AdSenseUnit({
  slot,
  className = "",
  compact = false,
  onFilledChange,
}: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const onFilledRef = useRef(onFilledChange);
  const [fill, setFill] = useState<FillState>("pending");

  useEffect(() => {
    onFilledRef.current = onFilledChange;
  }, [onFilledChange]);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;

    const mark = (filled: boolean) => {
      queueMicrotask(() => {
        setFill(filled ? "filled" : "empty");
        onFilledRef.current?.(filled);
      });
    };

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      mark(false);
      return;
    }

    const el = insRef.current;
    if (!el) {
      mark(false);
      return;
    }

    const check = () => {
      const status = el.getAttribute("data-ad-status");
      if (status === "filled") {
        mark(true);
        return true;
      }
      if (status === "unfilled") {
        mark(false);
        return true;
      }
      if (el.querySelector("iframe")) {
        mark(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const obs = new MutationObserver(() => {
      if (check()) obs.disconnect();
    });
    obs.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
      childList: true,
      subtree: true,
    });

    const t = window.setTimeout(() => {
      if (!check()) mark(false);
      obs.disconnect();
    }, 4500);

    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  if (fill === "empty") return null;

  const sizeClass =
    className || (compact ? "min-h-[90px]" : "min-h-[100px]");

  return (
    <div className={`overflow-hidden ${sizeClass}`} aria-hidden>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdSenseAnchor({ slot }: { slot: string }) {
  const [filled, setFilled] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ad-anchor-pad",
      filled ? "58px" : "0px",
    );
    return () => {
      document.documentElement.style.setProperty("--ad-anchor-pad", "0px");
    };
  }, [filled]);

  if (checked && !filled) return null;

  return (
    <div
      className={`pointer-events-auto fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur-sm ${
        !checked ? "opacity-0" : ""
      }`}
    >
      <div className="mx-auto max-w-3xl px-2 py-1">
        <AdSenseUnit
          slot={slot}
          className="min-h-[50px] max-h-[90px]"
          onFilledChange={(f) => {
            setFilled(f);
            setChecked(true);
          }}
        />
      </div>
    </div>
  );
}
