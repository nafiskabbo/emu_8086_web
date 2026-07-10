import Image from "next/image";
import Link from "next/link";

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo.svg"
      alt="emu8086web"
      width={size}
      height={size}
      priority
    />
  );
}

export function BrandWordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <span
        className="text-[28px] leading-none tracking-wide text-amber"
        style={{ fontFamily: "var(--font-vt323)" }}
      >
        emu8086
        <span className="text-ink">web</span>
      </span>
    </div>
  );
}

export function IdeLinkButton() {
  return (
    <Link
      href="/ide"
      className="inline-flex items-center justify-center bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#161303] transition hover:brightness-110"
    >
      Open IDE
    </Link>
  );
}
