/** Assembly or runtime error with optional source line number. */
export class AsmError extends Error {
  readonly line?: number;

  constructor(message: string, line?: number) {
    super(message);
    this.name = "AsmError";
    this.line = line;
  }
}
