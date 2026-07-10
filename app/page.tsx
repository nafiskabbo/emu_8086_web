import Link from "next/link";
import { BrandMark, BrandWordmark, IdeLinkButton } from "@/components/brand/brand-mark";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,176,0,0.12), transparent),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(58,63,46,0.15) 79px, rgba(58,63,46,0.15) 80px),
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(58,63,46,0.08) 79px, rgba(58,63,46,0.08) 80px)
          `,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <BrandWordmark />
        <Link
          href="/ide"
          className="text-xs font-medium tracking-wider text-ink-dim uppercase hover:text-amber"
        >
          IDE
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="mb-10 scale-150 opacity-90">
          <BrandMark size={64} />
        </div>

        <h1
          className="max-w-2xl text-5xl leading-tight text-amber sm:text-6xl"
          style={{
            fontFamily: "var(--font-vt323)",
            textShadow: "var(--brand-glow)",
          }}
        >
          emu8086web
        </h1>

        <p className="mt-4 max-w-md text-base text-ink-dim">
          Write, assemble, and debug 8086 assembly in your browser — no install required.
        </p>

        <div className="mt-10">
          <IdeLinkButton />
        </div>
      </main>

      <footer className="relative z-10 border-t border-line px-6 py-4 text-center text-[11px] text-ink-dim">
        Interpretive classroom emulator · Inspired by classic emu8086
      </footer>
    </div>
  );
}
