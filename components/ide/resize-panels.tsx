"use client";

import { useEffect, useRef } from "react";

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  onDrag: (delta: number) => void;
}

/** Drag handle using client coordinate deltas (more reliable than movementX). */
export function ResizeHandle({ direction, onDrag }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const pos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      if (delta !== 0) onDrag(delta);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [direction, onDrag]);

  return (
    <div
      role="separator"
      aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
      className={
        direction === "horizontal"
          ? "z-10 w-2 shrink-0 cursor-col-resize bg-line transition-colors hover:bg-amber active:bg-amber"
          : "z-10 h-2 shrink-0 cursor-row-resize bg-line transition-colors hover:bg-amber active:bg-amber"
      }
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.current = true;
        lastPos.current = direction === "horizontal" ? e.clientX : e.clientY;
        document.body.style.cursor =
          direction === "horizontal" ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
    />
  );
}
