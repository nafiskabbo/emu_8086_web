# TypeScript 7.0 Migration Guide (Go-Native Compiler)

> **Status as of this writing (July 2026): TypeScript 7.0 is stable / generally available.**
> It shipped as a Release Candidate on June 18, 2026, and Microsoft has now published the
> full "Announcing TypeScript 7.0" stable release. This guide reflects the **stable** release,
> not the RC. If you're reading this much later, sanity-check version numbers against
> https://devblogs.microsoft.com/typescript/ before running anything.

This doc is written so an AI coding agent (or a human) can follow it step-by-step to
migrate a repo from TypeScript 6.x to TypeScript 7.0. Copy the "Agent Instructions"
block at the bottom into your prompt if you want an agent to execute this unattended.

---

## 1. What actually changed

- The compiler and language service were ported from the old self-hosted
  TypeScript-in-TypeScript codebase ("Strada") to a **native Go codebase**
  ("Project Corsa"). This was a **port**, not a redesign — the type-checking
  algorithms and semantics are intentionally kept structurally identical to
  TypeScript 6.0.
- Microsoft's own benchmark: the ~1.5M-line VS Code codebase went from ~78s to
  ~7.5s for a full type-check (~10x). Editor project load and language-server
  responsiveness improved similarly, with fewer language-server crashes.
- **The package name and binary did not change for the stable release.** You
  install `typescript` from npm exactly like before, and you still run `tsc`.
  There is no separate `tsgo` binary in the stable release — `tsgo` only exists
  in the nightly preview package (`@typescript/native-preview`), which is
  unrelated infrastructure the team keeps around for testing bleeding-edge
  builds ahead of the next TypeScript version.
- **No stable programmatic API yet.** Tools that `import * as ts from "typescript"`
  and call into the compiler API (typescript-eslint, ts-morph, custom
  transformers, some bundler plugins) are not guaranteed to work against the
  Go compiler. A stable new API is targeted for **TypeScript 7.1**, not 7.0.
- TypeScript 7.0 inherits **all of TypeScript 6.0's new defaults** and turns
  everything that was merely deprecated in 6.0 into a **hard error** in 7.0.
  This is the part that actually breaks projects — see section 3.

## 2. Install

```bash
# Standard install — this is real, current, and correct for the stable release.
npm install -D typescript@latest

# Pin an exact version if you want reproducible CI:
npm install -D typescript@7.0.0
```

Run it exactly as before:

```bash
npx tsc --noEmit
npx tsc --build
```

### If you need to keep TypeScript 6.0 available (recommended during migration)

Because the compiler API isn't stable yet, tools like `typescript-eslint` may
still expect a TypeScript 6.x API. Microsoft publishes a compatibility package,
`@typescript/typescript6`, that re-exports the 6.0 API and ships a `tsc6` binary
so you can run both side by side without a naming collision:

```jsonc
// package.json
{
  "devDependencies": {
    // "typescript" stays on 6.x so linting/tooling that imports the API keeps working
    "typescript": "npm:@typescript/typescript6@^6.0.0",
    // alias the real TypeScript 7 compiler under a different name
    "typescript-7": "npm:typescript@^7.0.0"
  }
}
```

With this setup: `npx tsc` (via the `typescript` alias) still gives tools the
6.0 API, `tsc6` is also available explicitly, and you invoke the Go compiler
for your actual build/type-check step via `npx --package typescript-7 tsc`
(or add an npm script that points at `node_modules/typescript-7/bin/tsc`).

Drop this alias entirely once your tooling (ESLint, ts-morph, custom
transformers) confirms compatibility with TypeScript 7.1+'s stable API.

### Nightly bleeding-edge builds (optional, not needed for normal migration)

If you specifically want to track *unreleased* nightly builds ahead of the
next TypeScript version, that's a separate package with its own binary name:

```bash
npm install -D @typescript/native-preview
npx tsgo --noEmit
```

Don't use this for a normal 7.0 migration — it's for previewing what comes
*after* 7.0. The stable `typescript` package is what you want.

## 3. Breaking changes checklist (do this first)

These were **deprecated in TypeScript 6.0** and are **hard errors in 7.0**.
If you haven't already upgraded to 6.0 and cleared its deprecation warnings,
do that first — it's a much smaller, reversible step, and it tells you
exactly what 7.0 will reject.

| Old / deprecated | Status in 7.0 | Fix |
|---|---|---|
| `target: "es5"` | Hard error | Set `target` to `es2022` or later (or `esnext`) |
| `downlevelIteration` | No longer meaningful | Remove it |
| `moduleResolution: "node"` / `"node10"` | Hard error | Use `"nodenext"` (Node projects) or `"bundler"` (bundler/Vite/webpack projects) |
| `moduleResolution: "classic"` | Hard error | Use `"nodenext"` or `"bundler"` |
| `module: "amd" \| "umd" \| "system" \| "none"` | Hard error | Use `"esnext"` (with a bundler) or `"preserve"` |
| `baseUrl` | Hard error | Remove it; rewrite `paths` entries to be relative to the tsconfig directory instead of relative to `baseUrl` |
| `esModuleInterop: false` | Hard error | Remove the `false` (interop is always on) |
| `allowSyntheticDefaultImports: false` | Hard error | Remove the `false` |
| `outFile` (non-AMD/System) | Hard error in most configs | Use per-module output / a bundler |
| `ignoreDeprecations: "6.0"` | **Does not work in 7.0** | This was only ever a 6.0 escape hatch — you must actually fix the underlying options |

### Default value changes (silent, not errors — but will change behavior)

| Option | Old default | New default (7.0) | What to do |
|---|---|---|---|
| `strict` | `false` | `true` | Either embrace it and fix the resulting errors, or set `"strict": false` explicitly to opt out |
| `target` | (varied / es5-ish) | latest stable ECMAScript (e.g. `es2025`) | Set explicitly if you need a specific target |
| `module` | (varied) | `esnext` | Set explicitly if you need `commonjs`/`nodenext`/`preserve` |
| `rootDir` | inferred from input files | current directory (`./`) containing `tsconfig.json` | Set `"rootDir": "./src"` explicitly if your sources live in a subfolder — otherwise output nests as `dist/src/...` instead of `dist/...` |
| `types` | auto-discovered from `node_modules/@types` | `[]` (nothing auto-included) | Set `"types": ["node", "jest", ...]` explicitly for every `@types` package you rely on globally |
| `stableTypeOrdering` | opt-in | always on, cannot be disabled | No action needed unless you had disabled it; declaration emit ordering may shift slightly |

### Concrete before/after for the two changes that surprise people most

```jsonc
// BEFORE — relies on inference, silently breaks output layout in 7.0
{
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}

// AFTER — explicit rootDir keeps dist/index.js instead of dist/src/index.js
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

```jsonc
// BEFORE — baseUrl-relative paths (hard error in 7.0)
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": { "@app/*": ["app/*"] }
  }
}

// AFTER — paths relative to the tsconfig.json location, no baseUrl
{
  "compilerOptions": {
    "paths": { "@app/*": ["./src/app/*"] }
  }
}
```

```jsonc
// BEFORE — legacy resolution
{ "compilerOptions": { "module": "commonjs", "moduleResolution": "node" } }

// AFTER — pick one based on your setup
// Node.js project without a bundler:
{ "compilerOptions": { "module": "nodenext", "moduleResolution": "nodenext" } }
// Project using Vite/webpack/esbuild/Bun:
{ "compilerOptions": { "module": "esnext", "moduleResolution": "bundler" } }
```

## 4. New compiler flags (parallelism controls)

TypeScript 7.0 parallelizes parsing, type-checking, and emit across worker
threads/processes. Parsing and emit parallelize almost for free; type-checking
uses a fixed pool of workers because files share type information.

```bash
# Number of type-checking workers (default: 4)
tsc --checkers 8

# Number of parallel workers for multi-project (--build) orchestration
tsc --build --builders 4

# Force single-threaded operation (debugging, perf comparisons, constrained environments)
tsc --singleThreaded
```

Guidance: more `--checkers` helps on large codebases with many CPU cores, but
returns diminish and memory use grows — measure on your own repo rather than
maxing it out blindly.

`--watch` was also rebuilt on a new cross-platform file-watching foundation
(ported from Parcel's watcher) instead of polling, so cold start and rebuild
latency both drop noticeably, especially in large `node_modules` trees.

## 5. Known gaps in 7.0 (as of GA)

- **No stable compiler/programmatic API.** `typescript-eslint`, `ts-morph`,
  custom AST transformers, and codegen pipelines that `import` the compiler
  should keep using the TypeScript 6.0 API (via `@typescript/typescript6`)
  until TypeScript 7.1 ships a stable API.
- Declaration map generation and a few advanced `--build` / project-reference
  edge cases may have rough edges relative to 6.0 — check your specific setup
  before flipping CI over unconditionally.
- JavaScript/JSDoc type-checking was rewritten and is stricter/simpler; a
  handful of previously-recognized JSDoc patterns (e.g. certain `@enum` /
  `@constructor` tag usages) are no longer specially recognized.
- Editor/IDE plugins that hook into the old compiler API (some VS Code
  extensions, JetBrains plugins) may lag behind until they update for the
  new architecture.

## 6. Step-by-step migration plan

1. **Baseline on TypeScript 6.0 first**, if you haven't already. Fix every
   deprecation warning it emits — do **not** use `ignoreDeprecations: "6.0"` as
   a permanent fix, since it stops working entirely in 7.0.
2. **Delete stale build artifacts.** `.tsbuildinfo` incremental-build files
   from the old JS compiler are not compatible with the Go compiler's
   incremental format.
   ```bash
   find . -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete
   ```
3. **Install TypeScript 7.0** (`npm install -D typescript@latest`), keeping
   the `@typescript/typescript6` alias in place for anything that imports the
   compiler API directly (see section 2).
4. **Update `tsconfig.json`** per the table in section 3: remove
   removed/deprecated options, set `rootDir` and `types` explicitly, choose
   `moduleResolution`/`module` deliberately instead of relying on defaults.
5. **Run a full type-check** and compare diagnostics against your last known
   good TypeScript 6.0 run:
   ```bash
   npx tsc --noEmit > ts7-output.txt 2>&1
   diff ts6-baseline-output.txt ts7-output.txt
   ```
   Any new errors should map cleanly to the table in section 3 (strict mode,
   moved defaults) — if you see something unexplained, check section 5's
   known-gaps list before assuming it's a real regression.
6. **Update build scripts and CI** to run the same `tsc` command as always —
   no script changes should be needed beyond new flags you opt into
   (`--checkers`, `--builders`, `--singleThreaded`).
7. **Update editor tooling.** If you were using the "TypeScript Native
   Preview" VS Code extension during beta/RC, switch back to the standard
   built-in TypeScript support (or make sure it's pointed at your project's
   local `typescript` 7.0 install) now that this is the standard release.
8. **Run both compilers in CI for one transition cycle** if you want extra
   safety: keep a non-blocking job running the old TypeScript 6.0 (`tsc6`, if
   you kept the alias) alongside the new default, and drop it once you're
   confident.
9. **Drop the TypeScript 6.0 alias** once your tooling ecosystem
   (typescript-eslint, ts-morph, custom transformers) confirms support for
   TypeScript 7.1's stable API.
10. **File issues** for any genuine compiler regressions at
    https://github.com/microsoft/typescript-go/issues (not the main
    `microsoft/TypeScript` repo — that's for language/API-level issues).

## 7. Quick reference tsconfig.json baseline

```jsonc
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",        // or "esnext" + "moduleResolution": "bundler"
    "moduleResolution": "nodenext",
    "strict": true,
    "types": ["node"],
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "incremental": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Agent Instructions (paste this into your coding agent's prompt)

```
Migrate this repository from TypeScript 6.x to TypeScript 7.0 following
typescript-7-migration-guide.md in this repo/gist. Specifically:

1. Delete all *.tsbuildinfo files outside node_modules.
2. Run `npx tsc --noEmit` and save the output as a baseline.
3. Update package.json: set "typescript" to "^7.0.0". If any dependency
   (typescript-eslint, ts-morph, custom transformer) imports the `typescript`
   package's compiler API directly, add it as "typescript": "npm:@typescript/typescript6@^6.0.0"
   instead, and add a separate "typescript-7": "npm:typescript@^7.0.0" entry
   for the actual build/type-check step.
4. In every tsconfig.json (including base configs used via "extends"):
   - Remove baseUrl; rewrite any "paths" entries to be relative to the
     tsconfig.json location instead.
   - Replace target: "es5" with target: "es2022" (or newer) unless the
     project explicitly needs ES5 output, in which case flag this for human review.
   - Replace moduleResolution "node"/"node10"/"classic" with "nodenext" if the
     project has no bundler, or "bundler" if it uses Vite/webpack/esbuild/Bun.
   - Replace module "amd"/"umd"/"system"/"none" with "esnext" or "preserve".
   - Remove esModuleInterop: false and allowSyntheticDefaultImports: false
     (just delete the false; the behavior is now always on).
   - Add explicit "rootDir" pointing at the actual source directory if not present.
   - Add explicit "types" array listing every @types package actually used
     (check node_modules/@types for what's currently installed and referenced).
   - Remove any "ignoreDeprecations" field.
5. Run `npx tsc --noEmit` again and diff against the baseline from step 2.
   For every new error, resolve it by referencing the breaking-changes table
   in the guide (most will be strict-mode violations from the new
   strict: true default — fix them properly, don't silently disable strict
   unless told to).
6. Update CI config and npm scripts to keep using `tsc`/`tsc --build` as
   before; add `--checkers <N>` only if a human asks for perf tuning.
7. Do not attempt to change custom AST transformers, ts-morph scripts, or
   typescript-eslint config to use the new compiler API — leave those on the
   6.0 API alias (typescript-7.1 will have a stable API for this later).
8. Summarize every tsconfig.json change and every new type error fixed, and
   flag anything you were unsure about instead of guessing silently.
```
