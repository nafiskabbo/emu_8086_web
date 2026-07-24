/** Light MASM-style formatter for the custom textarea editor. */

const SECTION_RE = /^\.(model|stack|data|code)\b/i;
const LABEL_ONLY_RE = /^(\w+)\s*:\s*$/;
const LABEL_WITH_REST_RE = /^(\w+)\s*:\s*(.+)$/;
const PROC_RE = /^(\w+)\s+proc\b/i;
const ENDP_RE = /^(\w+)\s+endp\b/i;
const END_RE = /^end(\s|$)/i;

function leadingIndent(line: string): string {
  const m = line.match(/^[ \t]*/);
  return m ? m[0] : "";
}

function stripLeading(line: string): string {
  return line.replace(/^[ \t]+/, "");
}

/** Split code vs trailing comment while respecting quotes. */
function splitCodeComment(line: string): { code: string; comment: string } {
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === ";") {
      return { code: line.slice(0, i).trimEnd(), comment: line.slice(i) };
    }
  }
  return { code: line.trimEnd(), comment: "" };
}

/**
 * Format assembly source: labels flush-left, instructions indented one level,
 * section directives / end at column 0. Preserves string and comment text.
 */
export function formatAsm(source: string, tabSize = 4): string {
  const indent = " ".repeat(Math.max(1, tabSize));
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (const raw of lines) {
    if (!raw.trim()) {
      out.push("");
      continue;
    }

    const prefix = leadingIndent(raw);
    const { code, comment } = splitCodeComment(stripLeading(raw));
    const commentPart = comment ? (code ? ` ${comment}` : comment) : "";

    if (!code) {
      out.push(prefix + commentPart.trimStart());
      continue;
    }

    if (SECTION_RE.test(code) || END_RE.test(code) || ENDP_RE.test(code)) {
      out.push(code + commentPart);
      continue;
    }

    if (PROC_RE.test(code)) {
      out.push(code + commentPart);
      continue;
    }

    const labelOnly = code.match(LABEL_ONLY_RE);
    if (labelOnly) {
      out.push(`${labelOnly[1]}:` + commentPart);
      continue;
    }

    const labelRest = code.match(LABEL_WITH_REST_RE);
    if (labelRest) {
      out.push(`${labelRest[1]}:`);
      out.push(indent + labelRest[2].trim() + commentPart);
      continue;
    }

    out.push(indent + code + commentPart);
  }

  return out.join("\n");
}

/** Format only the selected line range; returns full source with that range replaced. */
export function formatAsmSelection(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  tabSize = 4,
): { next: string; start: number; end: number } {
  const text = source.replace(/\r\n/g, "\n");
  const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
  const searchFrom =
    selectionEnd > selectionStart && text[selectionEnd - 1] === "\n"
      ? selectionEnd - 1
      : selectionEnd;
  const nextNl = text.indexOf("\n", searchFrom);
  const lineEnd = nextNl === -1 ? text.length : nextNl;
  const block = text.slice(lineStart, lineEnd);
  const formatted = formatAsm(block, tabSize);
  const next = text.slice(0, lineStart) + formatted + text.slice(lineEnd);
  return {
    next,
    start: lineStart,
    end: lineStart + formatted.length,
  };
}

/** Indent to insert after Enter, based on the previous line. */
export function indentAfterEnter(prevLine: string, tabSize = 4): string {
  const indentUnit = " ".repeat(Math.max(1, tabSize));
  const base = leadingIndent(prevLine);
  const trimmed = stripLeading(prevLine).trim();
  if (!trimmed) return base;

  const { code } = splitCodeComment(trimmed);
  if (!code) return base;

  if (LABEL_ONLY_RE.test(code) || PROC_RE.test(code)) {
    return base + indentUnit;
  }

  // Keep indent after section headers so the next line stays under .data/.code
  if (SECTION_RE.test(code)) {
    return base + indentUnit;
  }

  return base;
}
