import { DEFAULT_SOURCE } from "@/lib/emulator";

export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  dirty: boolean;
}

export const FILES_STORAGE_KEY = "emu8086web:files:v1";
export const ACTIVE_FILE_KEY = "emu8086web:activeFile";

export function createFileId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultFile(name = "main.asm"): WorkspaceFile {
  return {
    id: createFileId(),
    name,
    content: DEFAULT_SOURCE,
    dirty: false,
  };
}

export function ensureAsmExtension(name: string): string {
  const trimmed = name.trim() || "untitled.asm";
  return /\.(asm|txt|inc)$/i.test(trimmed) ? trimmed : `${trimmed}.asm`;
}

export function saveFilesToStorage(
  files: WorkspaceFile[],
  activeId: string,
): void {
  localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  localStorage.setItem(ACTIVE_FILE_KEY, activeId || "");
}

export function loadFilesFromStorage(): {
  files: WorkspaceFile[];
  activeId: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_FILE_KEY) ?? "";
    if (raw === null) return null;
    const files = JSON.parse(raw) as WorkspaceFile[];
    if (!Array.isArray(files)) return null;
    if (files.length === 0) return { files: [], activeId: "" };
    const id =
      activeId && files.some((f) => f.id === activeId)
        ? activeId
        : files[0].id;
    return { files, activeId: id };
  } catch {
    return null;
  }
}
