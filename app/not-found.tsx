import Link from "next/link";
import { APP_NAME, APP_REPO_URL } from "@/lib/version";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-6 py-16 text-ink">
      {/* Ambient register grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-amber/20 blur-3xl"
      />

      <div className="relative z-[1] w-full max-w-lg">
        <p className="font-mono text-[10px] tracking-[0.28em] text-ink-dim uppercase">
          {APP_NAME} · interrupt vector
        </p>

        <div className="mt-4 border border-line bg-panel/90 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <span className="font-mono text-[11px] text-ink-dim">
              CS:IP&nbsp;&nbsp;F000:0404
            </span>
            <span className="badge badge-error font-mono">halted</span>
          </div>

          <h1 className="mt-5 font-[family-name:var(--font-vt323)] text-[5.5rem] leading-none tracking-wide text-amber sm:text-[7rem]">
            404h
          </h1>
          <p className="mt-1 font-mono text-sm text-ink">
            INT 21h&nbsp;/&nbsp;AH=4Ch — route not found
          </p>
          <p className="mt-3 max-w-md text-sm text-ink-dim">
            The CPU looked for that address, found nothing mapped, and parked
            the instruction pointer. Your program (and the IDE) still live at
            the origin.
          </p>

          <pre
            aria-hidden
            className="mt-5 overflow-x-auto rounded border border-line bg-panel-2 p-3 font-mono text-[11px] leading-relaxed text-ink-dim"
          >
            {`0000:  B4 4C        MOV  AH, 4Ch
0002:  B0 01        MOV  AL, 01h   ; not found
0004:  CD 21        INT  21h
0006:  ?? ??        ; <-- you are here`}
          </pre>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="btn btn-primary">
              Return to IDE (JMP 0000)
            </Link>
            <a
              href={APP_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex items-center gap-1.5"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Contribute
            </a>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-wider text-ink-dim uppercase">
          AX=0001 · ZF=0 · CF=1
        </p>
      </div>
    </main>
  );
}
