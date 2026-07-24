import { APP_NAME, APP_VERSION } from "@/lib/version";

const CONTEXT_RADIUS = 5;

export function buildErrorClipboardText(opts: {
  message: string;
  line: number | null;
  source: string;
}): string {
  const { message, line, source } = opts;
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const kind = /^Assembly error/i.test(message)
    ? "Assembly error"
    : /^Runtime error/i.test(message)
      ? "Runtime error"
      : "Error";

  const parts: string[] = [
    `Please help fix this ${APP_NAME} (browser 8086 / emu8086 / Intel MASM-style) issue.`,
    `App: ${APP_NAME} v${APP_VERSION}`,
    `Target: Intel 8086 assembly (MASM-style)`,
    "",
    `${kind}: ${message}`,
  ];

  if (line != null && line >= 1) {
    parts.push(`Line: ${line}`);
    parts.push("");
    parts.push("Source context:");
    const start = Math.max(0, line - 1 - CONTEXT_RADIUS);
    const end = Math.min(lines.length - 1, line - 1 + CONTEXT_RADIUS);
    const width = String(end + 1).length;
    for (let i = start; i <= end; i++) {
      const marker = i === line - 1 ? ">" : " ";
      parts.push(
        `${marker} ${String(i + 1).padStart(width, " ")} | ${lines[i] ?? ""}`,
      );
    }
  } else {
    parts.push("");
    parts.push("Full source:");
    parts.push("```asm");
    parts.push(source);
    parts.push("```");
  }

  parts.push("");
  parts.push(
    "Solve this for emu8086web (browser 8086 assembler/emulator). Explain the fix and provide the corrected code.",
  );

  return parts.join("\n");
}
