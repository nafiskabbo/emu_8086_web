# TypeScript 5.x to 6.0 Migration Guide

[TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/) is a **transition release** bridging 5.9 and the forthcoming 7.0 (a native Go port). Most changes are new defaults and deprecations preparing for 7.0. Here is what you need to do:

**Most projects need these tsconfig changes:**

```jsonc
{
    "compilerOptions": {
        "types": ["node"],           // @types are no longer auto-discovered (see §1.6)
        "rootDir": "./src"           // no longer inferred from source files (see §1.5)
    }
}
```

**You may also need to:**
- Set `"strict": false` if your project is not ready for strict mode (now the default -- see [§1.1](#11-strict-defaults-to-true))
- Set explicit `target`, `module`, or `moduleResolution` if you relied on old defaults (see [§1.2](#12-target-defaults-to-es2025-the-current-year-es-version)--[§1.4](#14-moduleresolution-defaults-to-bundler))
- Remove deprecated options like `baseUrl`, `outFile`, `downlevelIteration` (see [§2](#2-deprecations))
- Replace `assert { }` with `with { }` on imports (see [§2.11](#211-asserts-keyword-on-imports-deprecated))

**Automated migration:** The [`ts5to6` tool](https://github.com/andrewbranch/ts5to6) handles the two most disruptive changes (`baseUrl` removal and `rootDir` inference) automatically.

**Escape hatch:** Add `"ignoreDeprecations": "6.0"` to silence deprecation warnings temporarily. This will not work in TypeScript 7.0.

<details>
<summary>Context and motivation</summary>

TypeScript 6.0 is the **last release based on the JavaScript codebase**. TypeScript 7.0 will be a native port written in Go that leverages shared-memory multi-threading for dramatically faster type checking.

The JS codebase is now in [maintenance mode](https://github.com/microsoft/TypeScript/issues/62963) -- only critical fixes, deprecation work, and 6.0/7.0 alignment changes will be merged. Most open PRs against the JS codebase will not be merged. All language service bugs have been [bulk-closed](https://github.com/microsoft/TypeScript/issues/62827) since the Go rewrite uses LSP from scratch -- if you hit an editor bug, test it in the [TypeScript Native Nightly extension](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) and file against [typescript-go](https://github.com/microsoft/typescript-go) if it still repros.

The majority of changes in TypeScript 6.0 are about **alignment and preparation for TypeScript 7.0**: new defaults that reflect the modern ecosystem, deprecations of legacy options that the Go-based compiler will not support, and a diagnostic migration flag (`--stableTypeOrdering`) to help compare output between the two codebases.

6.0 also ships genuine new features: improved type inference for methods, `#/` subpath imports, `es2025` target/lib, Temporal types, and several new standard library additions.

</details>

<details>
<summary>Release timeline</summary>

From the [TypeScript 6.0 Iteration Plan](https://github.com/microsoft/TypeScript/issues/63085):

- 2025-08: TypeScript 5.9 (last traditional 5.x release)
- 2025-12-02: [All language service bugs bulk-closed](https://github.com/microsoft/TypeScript/issues/62827) (TS7 uses LSP rewrite from scratch)
- 2026-01-08: [JS codebase enters maintenance mode](https://github.com/microsoft/TypeScript/issues/62963)
- 2026-02-11: [TypeScript 6.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/)
- 2026-02-24: TypeScript 6.0 RC
- 2026-03-17: TypeScript 6.0 Final
- TBD: TypeScript 7.0 (planned shortly after 6.0 stabilizes)

</details>

## Table of Contents

1. [New Default Values](#1-new-default-values)
2. [Deprecations](#2-deprecations)
3. [The `ignoreDeprecations` Mechanism](#3-the-ignoredeprecations-mechanism)
4. [New Features](#4-new-features)
5. [New Standard Library Types](#5-new-standard-library-types)
6. [Breaking Behavioral Changes](#6-breaking-behavioral-changes)
7. [Migration Checklist](#7-migration-checklist)
8. [Appendix: All Referenced Pull Requests](#appendix-all-referenced-pull-requests)
9. [Appendix: Referenced GitHub Issues](#appendix-referenced-github-issues)
10. [Resources](#resources)

---

## 1. New Default Values

TypeScript 6.0 changes several compiler option defaults. These changes reflect the reality that virtually every runtime is evergreen, ESM is dominant, and stricter typing is universally preferred.

<details>
<summary>Full tsconfig reference for restoring 5.9 behavior</summary>

```jsonc
{
    "compilerOptions": {
        // Most projects need these (§1.5, §1.6):
        "rootDir": "./src",               // was inferred from input files, now defaults to "."
        "types": ["node"],                 // was all @types, now defaults to none

        // Set explicitly if you relied on old defaults (§1.1-§1.4):
        // "strict": false,               // now true by default
        // "target": "es2020",            // now es2025 by default
        // "module": "commonjs",          // now es2022 (resolved from target)
        // "moduleResolution": "nodenext", // now bundler (resolved from module)

        // Rarely needed (§1.7-§1.10):
        // "noUncheckedSideEffectImports": false,  // now true
        // "libReplacement": true,                 // now false
        // "esModuleInterop": true,                // already was true for most configs
        // "allowSyntheticDefaultImports": true     // already was true for most configs
    }
}
```

Note: `rootDir` only matters if you emit files (i.e., you have `outDir` set). If you use TypeScript only for type-checking (`noEmit: true`) with an external bundler like esbuild/Rollup/Vite, you don't need to set `rootDir` at all -- the new default won't affect you.

</details>

### 1.1 [`strict`](https://www.typescriptlang.org/tsconfig/#strict) defaults to `true`

**PR:** [#63087](https://github.com/microsoft/TypeScript/pull/63087) | **Issue:** [#62333](https://github.com/microsoft/TypeScript/issues/62333)

Previously `false`. Now `true`.

**Impact:** Projects that relied on `strict: false` implicitly will now see errors from `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`, and `alwaysStrict`.

**Migration:**
```diff
  {
      "compilerOptions": {
+         "strict": false  // only if you need to opt out
      }
  }
```

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:906-916`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L906-L916)

```typescript
{
    name: "strict",
    type: "boolean",
    // ...
    defaultValueDescription: true,
}
```

</details>

### 1.2 [`target`](https://www.typescriptlang.org/tsconfig/#target) defaults to `es2025` (the current-year ES version)

**PR:** [#63067](https://github.com/microsoft/TypeScript/pull/63067) | **Issues:** [#62198](https://github.com/microsoft/TypeScript/issues/62198), [#62196](https://github.com/microsoft/TypeScript/issues/62196)

Previously inferred as `ES3`. Now defaults to `ScriptTarget.LatestStandard`, which is `ES2025`.

**Impact:** If your project targets older runtimes, you need to set `target` explicitly. No downlevel transforms will be applied by default (e.g., no class field transpilation, no async/await transpilation).

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/types.ts:7686-7690`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/types.ts#L7686-L7690)

```typescript
ES2025 = 12,
ESNext = 99,
JSON = 100,
Latest = ESNext,
LatestStandard = ES2025,
```

The computed default is applied in [`src/compiler/utilities.ts:9048-9053`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/utilities.ts#L9048-L9053):

```typescript
target: {
    dependencies: [],
    computeValue: compilerOptions => {
        const target = compilerOptions.target === ScriptTarget.ES3 ? undefined : compilerOptions.target;
        return target ?? ScriptTarget.LatestStandard;
    },
},
```

Note that `ES3` is treated as `undefined` and falls through to `LatestStandard`, effectively making `ES3` a no-op even before its deprecation diagnostic fires.

</details>

### 1.3 [`module`](https://www.typescriptlang.org/tsconfig/#module) resolves to `es2022` (documented as `esnext`)

**PR:** [#62669](https://github.com/microsoft/TypeScript/pull/62669)

The module kind is now computed from the target. With `target` defaulting to `ES2025` (which is `>= ES2022`), the resolved `module` will be `ES2022`. In practice, when no `module` or `target` is explicitly set, you get `ES2022` module output (which supports top-level await).

**Impact:** Projects that relied on CommonJS output by default must now explicitly set `"module": "commonjs"`.

<details>
<summary>How the module default is computed</summary>

The logic is at [`src/compiler/utilities.ts:9055-9076`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/utilities.ts#L9055-L9076):

```typescript
module: {
    dependencies: ["target"],
    computeValue: (compilerOptions): ModuleKind => {
        if (typeof compilerOptions.module === "number") {
            return compilerOptions.module;
        }
        const target = _computedOptions.target.computeValue(compilerOptions);
        if (target === ScriptTarget.ESNext) {
            return ModuleKind.ESNext;
        }
        if (target >= ScriptTarget.ES2022) {
            return ModuleKind.ES2022;
        }
        // ...
    },
},
```

The `commandLineParser.ts` declares the default description as `esnext` for documentation purposes.

</details>

### 1.4 [`moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution) defaults to `bundler`

**PR:** [#62669](https://github.com/microsoft/TypeScript/pull/62669)

The module resolution default is computed from the module kind. Since the default module kind is now `ES2022` (which is not `None`/`AMD`/`UMD`/`System`/`NodeNext`/`Node16+`), the fallback is `ModuleResolutionKind.Bundler`.

**Impact:** Projects that relied on `node10` resolution by default may see different module resolution behavior. If you target Node.js directly, set `"moduleResolution": "nodenext"`.

<details>
<summary>How the moduleResolution default is computed</summary>

Source: [`src/compiler/utilities.ts:9077-9098`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/utilities.ts#L9077-L9098)

```typescript
moduleResolution: {
    dependencies: ["module", "target"],
    computeValue: (compilerOptions): ModuleResolutionKind => {
        if (compilerOptions.moduleResolution !== undefined) {
            return compilerOptions.moduleResolution;
        }
        const moduleKind = _computedOptions.module.computeValue(compilerOptions);
        switch (moduleKind) {
            case ModuleKind.None:
            case ModuleKind.AMD:
            case ModuleKind.UMD:
            case ModuleKind.System:
                return ModuleResolutionKind.Classic;
            case ModuleKind.NodeNext:
                return ModuleResolutionKind.NodeNext;
        }
        if (ModuleKind.Node16 <= moduleKind && moduleKind < ModuleKind.NodeNext) {
            return ModuleResolutionKind.Node16;
        }
        return ModuleResolutionKind.Bundler;
    },
},
```

</details>

### 1.5 [`rootDir`](https://www.typescriptlang.org/tsconfig/#rootDir) defaults to `.` (directory of `tsconfig.json`)

**PR:** [#62418](https://github.com/microsoft/TypeScript/pull/62418)

Previously, `rootDir` was inferred from the common source directory of all input files. Now, when a `tsconfig.json` exists, it defaults to the directory containing that file (`"${configDir}"`).

> [!NOTE]
> This is **not** the same as the similarly-named option `rootDirs`, which continues to work the same in both 6.0 and 7.0.

**Impact:** `rootDir` controls what path prefix gets stripped from source file paths when placing them under `outDir`. Consider a typical project layout:

```
my-project/
├── tsconfig.json        ← rootDir now defaults to here (".")
├── src/
│   ├── index.ts
│   └── utils.ts
└── dist/                ← outDir
```

In TypeScript 5.9, with no explicit `rootDir`, TypeScript would scan all input files, compute their common directory (`src/`), and use that as `rootDir`. So `src/index.ts` would strip `src/` and emit to `dist/index.js`.

In TypeScript 6.0, `rootDir` defaults to the `tsconfig.json` directory (`.`), not the computed common directory. So `src/index.ts` now strips `.` (the project root) and **preserves** the `src/` prefix in the output:

```
# TypeScript 5.9 (rootDir inferred as "src/")
dist/index.js
dist/utils.js

# TypeScript 6.0 (rootDir defaults to ".")
dist/src/index.js        ← unexpected nesting!
dist/src/utils.js
```

**You'll know this is the issue if** files start appearing at `dist/src/index.js` instead of `dist/index.js` after upgrading.

**TypeScript will error in common cases.** The PR didn't just silently change the output layout -- it added a **safety net**. When all of these conditions are true:

- `noEmit` is not set (you're actually emitting files)
- `composite` is not set (composite projects already had this behavior)
- `rootDir` is not explicitly set
- A `tsconfig.json` exists
- `outDir`, `declarationDir`, or `outFile` is specified

...TypeScript computes what the old 5.9 inferred root would have been ([`getComputedCommonSourceDirectory`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/emitter.ts#L668)), compares it to the new default (the tsconfig directory), and if they differ, emits **diagnostic 5011**:

```
The common source directory of 'tsconfig.json' is './src'.
The 'rootDir' setting must be explicitly set to this or another path
to adjust your output's file layout.
```

So you won't get silently wrong output -- you'll get an error telling you exactly what to set `rootDir` to.

**Migration:**
```diff
  {
      "compilerOptions": {
+         "rootDir": "./src"
      },
      "include": ["./src"]
  }
```

Note that this often means both `rootDir` and `include` end up specifying the same directory, which feels redundant but is intentional -- `include` controls which files are part of the project, while `rootDir` controls the output directory structure.

The [`ts5to6` migration tool](https://github.com/andrewbranch/ts5to6) can automatically adjust `rootDir` across your codebase.

<details>
<summary>Implementation details</summary>

This change was motivated by two things ([#62194](https://github.com/microsoft/TypeScript/issues/62194)):

1. **Performance:** The old behavior required computing the full set of input files just to determine the output directory structure. With the new default, the output structure is known immediately from the tsconfig location.
2. **Language service:** The new behavior lets the language service trivially determine whether a file could belong to a given `tsconfig.json` without loading and parsing the project first.

The actual code change ([commit `7affa9e540`](https://github.com/microsoft/TypeScript/commit/7affa9e5403035b6d281616e6651529e7387f253)) was a single-word removal in [`getCommonSourceDirectory`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/emitter.ts#L636):

```diff
- else if (options.composite && options.configFilePath) {
+ else if (options.configFilePath) {
```

**Before (5.9):** The tsconfig-directory fallback only applied when `composite: true` (project references mode). For regular non-composite projects, it fell through to [`computeCommonSourceDirectoryOfFilenames`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L342) -- a function that scans every input file path and computes their longest common directory prefix.

**After (6.0):** The `options.composite` guard was removed. Now *any* project with a `tsconfig.json` uses the config file's directory as `rootDir`. The same guard removal was applied in [`src/compiler/utilities.ts`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/utilities.ts#L6635) and [`src/compiler/moduleNameResolver.ts`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/moduleNameResolver.ts#L2892).

The safety-net diagnostic is implemented at [`src/compiler/program.ts:4259-4286`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4259-L4286).

</details>

### 1.6 [`types`](https://www.typescriptlang.org/tsconfig/#types) defaults to `[]`

**PR:** [#63054](https://github.com/microsoft/TypeScript/pull/63054) | **Issue:** [#62195](https://github.com/microsoft/TypeScript/issues/62195)

Previously, TypeScript auto-discovered all `@types` packages in `node_modules/@types`. Now it defaults to an empty array, meaning **no ambient type packages are auto-included**.

**Impact:** This is the change that will affect the most projects. You will see errors like:
- `Cannot find name 'process'`
- `Cannot find name 'describe'`
- `Cannot find module 'fs'`
- `Cannot find name 'Buffer'`

**Migration:**
```diff
  {
      "compilerOptions": {
+         "types": ["node"]
      }
  }
```

Or for test projects:
```diff
  {
      "compilerOptions": {
+         "types": ["node", "jest"]
      }
  }
```

To restore the old behavior (auto-discover all `@types`):
```diff
  {
      "compilerOptions": {
+         "types": ["*"]
      }
  }
```

> [!NOTE]
> - `"types": ["*"]` is a special token, not a glob pattern. Patterns like `"node*"` will not work.
> - Omitting `types` now means "include none" (previously "include all"). Setting `types: null` also means "include none".
> - Many projects have seen **20-50% build time improvements** from explicitly specifying `types` instead of auto-discovering hundreds of transitive `@types` packages.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/moduleNameResolver.ts:813-816`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/moduleNameResolver.ts#L813-L816)

```typescript
export function getAutomaticTypeDirectiveNames(options: CompilerOptions, host: ModuleResolutionHost): string[] {
    if (!usesWildcardTypes(options)) {
        return options.types ?? [];
    }
    // ...
}
```

</details>

### 1.7 [`noUncheckedSideEffectImports`](https://www.typescriptlang.org/tsconfig/#noUncheckedSideEffectImports) defaults to `true`

**PR:** [#62443](https://github.com/microsoft/TypeScript/pull/62443) | **Issue:** [#62421](https://github.com/microsoft/TypeScript/issues/62421)

Previously `false`. Now `true`.

**Impact:** Side-effect-only imports (e.g., `import "./polyfill"`) will now be checked for resolution. If TypeScript cannot find the module, it will report an error. This catches typos like `import "./polyfil"`.

**Migration:** If you have side-effect imports that intentionally don't resolve (e.g., CSS imports handled by a bundler), set `"noUncheckedSideEffectImports": false`.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:1273-1281`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L1273-L1281)

```typescript
{
    name: "noUncheckedSideEffectImports",
    type: "boolean",
    affectsSemanticDiagnostics: true,
    affectsBuildInfo: true,
    category: Diagnostics.Modules,
    description: Diagnostics.Check_side_effect_imports,
    defaultValueDescription: true,
},
```

</details>

### 1.8 [`libReplacement`](https://www.typescriptlang.org/tsconfig/#libReplacement) defaults to `false`

**PR:** [#62391](https://github.com/microsoft/TypeScript/pull/62391) | **Issue:** [#62214](https://github.com/microsoft/TypeScript/issues/62214)

Previously `true`. Now `false`.

**Impact:** `libReplacement` previously caused TypeScript to attempt module resolution for every lib file (e.g., trying to resolve `@typescript/lib-es2020`). In most projects this never finds anything and just adds overhead in the form of failed resolutions and extra watch locations. Disabling it by default improves performance.

**Migration:** If you use `@typescript/lib-*` replacement packages, set `"libReplacement": true`.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:895-902`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L895-L902)

```typescript
{
    name: "libReplacement",
    type: "boolean",
    affectsProgramStructure: true,
    category: Diagnostics.Language_and_Environment,
    description: Diagnostics.Enable_lib_replacement,
    defaultValueDescription: false,
},
```

</details>

### 1.9 [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop) defaults to `true`

**PR:** [#62567](https://github.com/microsoft/TypeScript/pull/62567) | **Issue:** [#62529](https://github.com/microsoft/TypeScript/issues/62529)

Previously `false`. Now `true`.

**Impact:** `import express from "express"` (default import from CJS) now always works. Setting `esModuleInterop: false` is **deprecated** (see [section 2.7](#27---esmoduleinterop-false-and---allowsyntheticdefaultimports-false-deprecated)).

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:1189-1197`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L1189-L1197)

```typescript
{
    name: "esModuleInterop",
    // ...
    defaultValueDescription: true,
},
```

</details>

### 1.10 [`allowSyntheticDefaultImports`](https://www.typescriptlang.org/tsconfig/#allowSyntheticDefaultImports) defaults to `true`

**PR:** [#62567](https://github.com/microsoft/TypeScript/pull/62567)

Previously dependent on other settings. Now always `true`.

**Impact:** Minimal. This was already effectively `true` for most configurations. The change means `import React from 'react'` always works without explicit opt-in.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:1180-1186`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L1180-L1186)

```typescript
{
    name: "allowSyntheticDefaultImports",
    // ...
    defaultValueDescription: true,
},
```

</details>

### Summary of Default Changes

| Option | 5.9 Default | 6.0 Default |
|--------|------------|------------|
| `strict` | `false` | **`true`** |
| `target` | `ES3` | **`es2025`** (`LatestStandard`) |
| `module` | `CommonJS` (varies) | **`es2022`** (resolved from target; documented as `esnext`) |
| `moduleResolution` | `node10` (varies) | **`bundler`** (resolved from module) |
| `rootDir` | inferred from input files | **`.`** (tsconfig.json directory) |
| `types` | `["*"]` (all `@types`) | **`[]`** (none) |
| `noUncheckedSideEffectImports` | `false` | **`true`** |
| `libReplacement` | `true` | **`false`** |
| `esModuleInterop` | `false` | **`true`** |
| `allowSyntheticDefaultImports` | varies | **`true`** |

---

## 2. Deprecations

All deprecations in TypeScript 6.0 will become **hard removals in TypeScript 7.0**. They can be temporarily silenced (see [section 3](#3-the-ignoredeprecations-mechanism)).

<details>
<summary>Full list of deprecated options (source code)</summary>

The full list is in a single block at [`src/compiler/program.ts:4528-4559`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4528-L4559):

```typescript
checkDeprecations("6.0", "7.0", createDiagnostic, createDeprecatedDiagnostic => {
    if (options.alwaysStrict === false) {
        createDeprecatedDiagnostic("alwaysStrict", "false");
    }
    if (options.target === ScriptTarget.ES5) {
        createDeprecatedDiagnostic("target", "ES5");
    }
    if (options.moduleResolution === ModuleResolutionKind.Node10) {
        createDeprecatedDiagnostic("moduleResolution", "node10");
    }
    if (options.moduleResolution === ModuleResolutionKind.Classic) {
        createDeprecatedDiagnostic("moduleResolution", "classic");
    }
    if (options.baseUrl !== undefined) {
        createDeprecatedDiagnostic("baseUrl");
    }
    if (options.esModuleInterop === false) {
        createDeprecatedDiagnostic("esModuleInterop", "false");
    }
    if (options.allowSyntheticDefaultImports === false) {
        createDeprecatedDiagnostic("allowSyntheticDefaultImports", "false");
    }
    if (options.outFile) {
        createDeprecatedDiagnostic("outFile");
    }
    if (options.module === ModuleKind.None || options.module === ModuleKind.AMD ||
        options.module === ModuleKind.UMD || options.module === ModuleKind.System) {
        createDeprecatedDiagnostic("module", ModuleKind[options.module]);
    }
    if (options.downlevelIteration !== undefined) {
        createDeprecatedDiagnostic("downlevelIteration");
    }
});
```

</details>

### 2.1 [`target`](https://www.typescriptlang.org/tsconfig/#target)`: es3` and `es5` (deprecated)

**PR:** [#63067](https://github.com/microsoft/TypeScript/pull/63067) | **Issue:** [#62196](https://github.com/microsoft/TypeScript/issues/62196)

Both `es3` and `es5` targets are deprecated. ES5 was important for Internet Explorer, but IE is retired and ES2015 was released over a decade ago. The lowest supported target is now `ES2015`.

**Migration:** Change `target` to `es2015` or higher.

If you still need ES5 output, use an external compiler to post-process TypeScript's output:
- **esbuild:** `target: "es5"`
- **SWC:** `swc dist/esm -d dist/es5`
- **Vite:** `build.target`
- You can also use TS 6.x for emit and TS 7.x for type-checking only (`--noEmit`)

With ES5 gone, TypeScript no longer emits `__extends`, `__generator`/`__awaiter`, or `__spreadArray` helpers for the minimum target.

<details>
<summary>Deprecated key registration</summary>

**Source:** [`src/compiler/commandLineParser.ts:596`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L596)

```typescript
deprecatedKeys: new Set(["es3", "es5"]),
```

</details>

### 2.2 [`--downlevelIteration`](https://www.typescriptlang.org/tsconfig/#downlevelIteration) (deprecated)

**PR:** [#63071](https://github.com/microsoft/TypeScript/pull/63071)

`downlevelIteration` only had effect when targeting below ES2015 (ES3 or ES5). Since both are deprecated, this flag is now meaningless. Setting it to **any** value (even `false`) triggers a deprecation error.

**Migration:** Remove `downlevelIteration` from your `tsconfig.json` entirely.

- The flag was already a no-op for projects targeting ES2015+. Many major projects (Zod, SWR, Sentry, tldraw) had it set despite targeting ES2015+ where it had zero effect.
- If you inherit `downlevelIteration` from a shared base tsconfig you don't control, set `"downlevelIteration": null` in your config to neutralize the inherited value.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/program.ts:4556-4557`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4556-L4557)

```typescript
if (options.downlevelIteration !== undefined) {
    createDeprecatedDiagnostic("downlevelIteration");
}
```

</details>

### 2.3 [`--moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution) `node` / `node10` (deprecated)

**PR:** [#62338](https://github.com/microsoft/TypeScript/pull/62338) | **Issue:** [#62200](https://github.com/microsoft/TypeScript/issues/62200)

`node10` encoded Node.js 10's resolution algorithm, which predates ESM support, `exports` fields, self-name imports, and many other modern features. It is no longer representative of how Node.js resolves modules.

**Migration:**
- Targeting Node.js directly: use `"moduleResolution": "nodenext"`
- Using a bundler or Bun: use `"moduleResolution": "bundler"`

**What breaks when switching from `node10` to `nodenext`:**
- Extensionless relative imports (`import "./foo"` must become `import "./foo.js"`)
- Packages without `exports` fields may resolve differently
- CJS/ESM file distinction is enforced

Projects using `--module commonjs` without explicit `moduleResolution` will now get `bundler` resolution instead of `node10` -- this is a silent default change.

<details>
<summary>Deprecated key registration</summary>

**Source:** [`src/compiler/commandLineParser.ts:1107`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L1107)

```typescript
deprecatedKeys: new Set(["node", "node10", "classic"]),
```

</details>

### 2.4 [`--moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution) `classic` (deprecated)

**PR:** [#62669](https://github.com/microsoft/TypeScript/pull/62669) | **Issue:** [#62206](https://github.com/microsoft/TypeScript/issues/62206)

`classic` was TypeScript's original module resolution algorithm from before Node.js resolution became the de facto standard. No practical use case remains for it.

**Migration:** Use `"moduleResolution": "nodenext"` or `"moduleResolution": "bundler"`.

### 2.5 [`--module`](https://www.typescriptlang.org/tsconfig/#module) `amd`, `umd`, `system`, `none` (deprecated)

**PR:** [#62669](https://github.com/microsoft/TypeScript/pull/62669) | **Issue:** [#62199](https://github.com/microsoft/TypeScript/issues/62199)

AMD, UMD, and SystemJS were important when browsers lacked native module support. ESM is now universal. `none` (no module system) is also deprecated.

**Migration:** Use `"module": "esnext"`, `"module": "preserve"`, `"module": "commonjs"`, `"module": "nodenext"`, or adopt a bundler.

- This also implies dropped support for the `amd-module` directive.
- `module: none` is also deprecated (not prominently mentioned in the blog post). `allowUmdGlobalAccess` and `export as namespace` are NOT deprecated -- they are independent of the module format.
- Users who had `module: es2020` (or similar) without explicit `moduleResolution` were previously getting `classic` resolution. After 6.0, they'll get `bundler` instead -- a silent behavior change.

<details>
<summary>Deprecated key registration</summary>

**Source:** [`src/compiler/commandLineParser.ts:625`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L625)

```typescript
deprecatedKeys: new Set(["none", "amd", "system", "umd"]),
```

</details>

### 2.6 [`--baseUrl`](https://www.typescriptlang.org/tsconfig/#baseUrl) (deprecated)

**PR:** [#62509](https://github.com/microsoft/TypeScript/pull/62509) | **Issue:** [#62207](https://github.com/microsoft/TypeScript/issues/62207)

`baseUrl` was most commonly used as a prefix for `paths` entries, but it also acted as a lookup root for module resolution -- meaning `import "foo"` could silently resolve to `src/foo.ts` even when the developer only intended path-mapping for `@app/*` and `@lib/*`.

`paths` has not required `baseUrl` for a long time. In 6.0, `baseUrl` is deprecated and no longer serves as a module lookup root.

**Migration:** Inline the `baseUrl` prefix into your `paths` entries:
```diff
  {
      "compilerOptions": {
-         "baseUrl": "./src",
          "paths": {
-             "@app/*": ["app/*"],
-             "@lib/*": ["lib/*"]
+             "@app/*": ["./src/app/*"],
+             "@lib/*": ["./src/lib/*"]
          }
      }
  }
```

If you actually used `baseUrl` as a module lookup root (rare), add a catch-all path:
```json
{
    "compilerOptions": {
        "paths": {
            "*": ["./src/*"],
            "@app/*": ["./src/app/*"],
            "@lib/*": ["./src/lib/*"]
        }
    }
}
```

The [`ts5to6` migration tool](https://github.com/andrewbranch/ts5to6) can automatically remove `baseUrl` and rewrite `paths` entries across your codebase, including the `extends` interaction case.

> [!NOTE]
> **`extends` interaction pain point:** When a base tsconfig defines `paths` and extending configs set `baseUrl`, the `paths` were effectively reinterpreted against each extending config's `baseUrl`. After removing `baseUrl`, paths resolve strictly relative to the config file where they're defined. This means projects with shared base configs may need to define `paths` in more locations. `extends` does NOT merge `paths` -- they are always fully overridden.

<details>
<summary>Source code</summary>

[`src/compiler/program.ts:4541-4542`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4541-L4542)

</details>

### 2.7 [`--esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop) `false` and [`--allowSyntheticDefaultImports`](https://www.typescriptlang.org/tsconfig/#allowSyntheticDefaultImports) `false` (deprecated)

**PR:** [#62567](https://github.com/microsoft/TypeScript/pull/62567) | **Issue:** [#62529](https://github.com/microsoft/TypeScript/issues/62529)

These options can no longer be set to `false`. The safer interop behavior is always enabled. Both default to `true`.

**Migration:** Remove explicit `false` values. Change namespace imports to default imports where needed:
```diff
- import * as express from "express";
+ import express from "express";
```

> [!WARNING]
> This is a **runtime behavior change**, not just type-checking. With `esModuleInterop: true`, TypeScript now emits `__importDefault`/`__importStar` helpers (or imports them from `tslib`) that check for the `__esModule` marker at runtime. The emit for `import x from "./cjs"` changes from `require("./cjs").default` to a helper-wrapped call.

For projects wanting maximum correctness with CJS interop, `verbatimModuleSyntax` is the recommended stricter alternative.

<details>
<summary>Source code</summary>

[`src/compiler/program.ts:4544-4549`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4544-L4549)

</details>

### 2.8 [`--alwaysStrict`](https://www.typescriptlang.org/tsconfig/#alwaysStrict) `false` (deprecated)

**PR:** [#63089](https://github.com/microsoft/TypeScript/pull/63089) | **Issue:** [#62213](https://github.com/microsoft/TypeScript/issues/62213)

All code is now assumed to be in JavaScript strict mode.

**Impact:**
- TypeScript will now unconditionally emit `"use strict"` in non-ESM files. ESM files are already strict by spec, so this only affects CommonJS output.
- Strict mode reserves these identifiers: `implements`, `interface`, `let`, `package`, `private`, `protected`, `public`, `static`, `yield`. Any of these used as variable/parameter/function names in non-module, non-strict code will break.

**Migration:** Remove `alwaysStrict: false` from your tsconfig. If you have "sloppy mode" code that uses reserved words like `await`, `static`, `private`, or `public` as regular identifiers, rename them.

<details>
<summary>Source code</summary>

[`src/compiler/program.ts:4529-4531`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4529-L4531)

</details>

### 2.9 [`--outFile`](https://www.typescriptlang.org/tsconfig/#outFile) (deprecated)

**PR:** [#62981](https://github.com/microsoft/TypeScript/pull/62981)

`outFile` concatenated multiple inputs into a single output file. Modern bundlers (Webpack, Rollup, esbuild, Vite, Parcel) do this faster and with more features.

**Migration:** Use a bundler instead.

- Zero community members raised concerns about `outFile` removal in the deprecation tracking issue ([#54500](https://github.com/microsoft/TypeScript/issues/54500)). Top-800 repo tests showed no breakage, confirming negligible real-world usage.
- Users of `outFile` typically also used `module: amd/umd/system` -- the entire ecosystem (AMD/SystemJS concatenation + global scripts via `module: none` + ES5 downleveling) is being removed simultaneously.

<details>
<summary>Source code</summary>

[`src/compiler/program.ts:4550-4551`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4550-L4551)

</details>

### 2.10 Legacy `module` keyword for namespaces (deprecated)

**PR:** [#62876](https://github.com/microsoft/TypeScript/pull/62876) | **Issue:** [#62211](https://github.com/microsoft/TypeScript/issues/62211)

Using `module Foo { ... }` to declare a namespace is now a hard error. This is necessary because `module` blocks are a potential ECMAScript proposal that would conflict with the legacy TypeScript syntax.

**Migration:** Replace `module Foo { ... }` with `namespace Foo { ... }`.

- Ambient module declarations remain fully supported: `declare module "some-module" { ... }` still works.
- `declare module foo {` (unquoted/bare identifier) is also deprecated. Only `declare module "specifier" {}` (quoted string) remains valid.
- This applies to `.d.ts` files too. If a dependency on npm uses `module Foo {}` in its declarations, remediation options are: upgrade the dependency, fork it, or use `patch-package`. DefinitelyTyped was fully cleaned up over two years ago, so `@types` packages are not affected.

<details>
<summary>Source code</summary>

The error is emitted in the checker at [`src/compiler/checker.ts:48164`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/checker.ts#L48164):

```typescript
if (!(node.flags & (NodeFlags.Namespace | NodeFlags.GlobalAugmentation))) {
    error(node.name, Diagnostics.A_namespace_declaration_should_not_be_declared_using_the_module_keyword_Please_use_the_namespace_keyword_instead);
}
```

</details>

### 2.11 `asserts` keyword on imports (deprecated)

**PR:** [#63077](https://github.com/microsoft/TypeScript/pull/63077) | **Issue:** [#62210](https://github.com/microsoft/TypeScript/issues/62210)

The import assertions proposal (`assert { type: "json" }`) was replaced by the import attributes proposal (`with { type: "json" }`). The `assert` syntax is now a deprecation error.

**Migration:**
```diff
- import blob from "./data.json" assert { type: "json" }
+ import blob from "./data.json" with { type: "json" }
```

The rename from `assert` to `with` is not just cosmetic -- import attributes (`with`) can *influence* how a module is loaded/interpreted, while assertions (`assert`) could only *validate* properties. In practice for `{ type: "json" }` the behavior is the same.

<details>
<summary>Source code</summary>

[`src/compiler/checker.ts:48616-48620`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/checker.ts#L48616-L48620)

</details>

### 2.12 `/// <reference no-default-lib="true"/>` (deprecated)

**PR:** [#62435](https://github.com/microsoft/TypeScript/pull/62435)

This directive was largely misunderstood and misused. It is parsed but ignored.

**Migration:** Use `--noLib` or `--libReplacement` instead.

- The directive previously had two effects: suppressed default lib inclusion AND marked the file as a "default library" itself (making `skipDefaultLibCheck` apply to it). Both behaviors are removed.
- `sourceFile.hasNoDefaultLib` is now always `false` in the compiler API. Use `program.isSourceFileDefaultLibrary(file)` instead.

<details>
<summary>Source code</summary>

[`src/compiler/parser.ts:10636`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/parser.ts#L10636)

</details>

### Deprecation Summary Table

| Deprecated Option/Value | Replacement | PR |
|--------------------------|-------------|-----|
| `target: es3` / `es5` | `es2015` or higher | [#63067](https://github.com/microsoft/TypeScript/pull/63067) |
| `downlevelIteration` | Remove entirely | [#63071](https://github.com/microsoft/TypeScript/pull/63071) |
| `moduleResolution: node` / `node10` | `nodenext` or `bundler` | [#62338](https://github.com/microsoft/TypeScript/pull/62338) |
| `moduleResolution: classic` | `nodenext` or `bundler` | [#62669](https://github.com/microsoft/TypeScript/pull/62669) |
| `module: amd` / `umd` / `system` / `none` | `esnext`, `preserve`, `commonjs`, `nodenext` | [#62669](https://github.com/microsoft/TypeScript/pull/62669) |
| `baseUrl` | Inline into `paths` entries | [#62509](https://github.com/microsoft/TypeScript/pull/62509) |
| `esModuleInterop: false` | Remove (always `true`) | [#62567](https://github.com/microsoft/TypeScript/pull/62567) |
| `allowSyntheticDefaultImports: false` | Remove (always `true`) | [#62567](https://github.com/microsoft/TypeScript/pull/62567) |
| `alwaysStrict: false` | Remove (always strict) | [#63089](https://github.com/microsoft/TypeScript/pull/63089) |
| `outFile` | Use a bundler | [#62981](https://github.com/microsoft/TypeScript/pull/62981) |
| `module Foo { }` syntax | `namespace Foo { }` | [#62876](https://github.com/microsoft/TypeScript/pull/62876) |
| `assert { }` on imports | `with { }` | [#63077](https://github.com/microsoft/TypeScript/pull/63077) |
| `/// <reference no-default-lib="true"/>` | `--noLib` or `--libReplacement` | [#62435](https://github.com/microsoft/TypeScript/pull/62435) |

---

## 3. The `ignoreDeprecations` Mechanism

All 6.0 deprecations can be temporarily silenced by setting `"ignoreDeprecations": "6.0"` in your `tsconfig.json`. This is intended as a transitional aid, not a permanent solution -- **TypeScript 7.0 will hard-remove all deprecated options regardless of `ignoreDeprecations`**.

### How It Works

Valid values are `"5.0"` and `"6.0"`. Any other value produces diagnostic 5103: "Invalid value for '--ignoreDeprecations'."

A deprecation warning fires only if `ignoreDeprecationsVersion < deprecatedInVersion`. Setting `"ignoreDeprecations": "6.0"` means `6.0 < 6.0` is `false`, so the 6.0 deprecation warnings are suppressed.

<details>
<summary>Implementation details</summary>

**Option definition:** [`src/compiler/commandLineParser.ts:1683-1687`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L1683-L1687)

```typescript
{
    name: "ignoreDeprecations",
    type: "string",
    defaultValueDescription: undefined,
}
```

**Version validation:** [`src/compiler/program.ts:4428-4437`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4428-L4437)

```typescript
function getIgnoreDeprecationsVersion(): Version {
    const ignoreDeprecations = options.ignoreDeprecations;
    if (ignoreDeprecations) {
        if (ignoreDeprecations === "5.0" || ignoreDeprecations === "6.0") {
            return new Version(ignoreDeprecations);
        }
        reportInvalidIgnoreDeprecations();  // Diagnostic 5103
    }
    return Version.zero;
}
```

**Silencing logic:** [`src/compiler/program.ts:4439-4473`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4439-L4473)

The [`checkDeprecations`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4439) function compares three versions:
1. `deprecatedInVersion` -- the version where the option was deprecated (e.g., `"6.0"`)
2. `removedInVersion` -- the version where it will be removed (e.g., `"7.0"`)
3. `ignoreDeprecationsVersion` -- the user's `ignoreDeprecations` value

</details>

### Diagnostic Codes

| Code | Message |
|------|---------|
| 5101 | `Option '{0}' is deprecated and will stop functioning in TypeScript {1}. Specify compilerOption '"ignoreDeprecations": "{2}"' to silence this error.` |
| 5102 | `Option '{0}' has been removed. Please remove it from your configuration.` |
| 5103 | `Invalid value for '--ignoreDeprecations'.` |
| 5107 | `Option '{0}={1}' is deprecated and will stop functioning in TypeScript {2}. Specify compilerOption '"ignoreDeprecations": "{3}"' to silence this error.` |
| 5108 | `Option '{0}={1}' has been removed. Please remove it from your configuration.` |
| 5111 | `Visit https://aka.ms/ts6 for migration information.` |

These are defined in [`src/compiler/diagnosticMessages.json`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/diagnosticMessages.json).

### Migration URL

Several deprecation diagnostics include the related message "Visit https://aka.ms/ts6 for migration information" (diagnostic 5111). This appears for `baseUrl` and `moduleResolution: node10` deprecations.

---

## 4. New Features

### 4.1 Less Context-Sensitivity on `this`-less Functions

**PR:** [#62243](https://github.com/microsoft/TypeScript/pull/62243) (by [Mateusz Burzynski / Andarist](https://github.com/Andarist))

This is a type inference improvement. Previously, method-syntax functions in object literals were always treated as "contextually sensitive" because they have an implicit `this` parameter. This prevented TypeScript from using them as inference sources for generic type parameters during the first inference pass.

Now, if the function body never actually references `this`, the function is **not** considered contextually sensitive and participates in the first inference pass. This fixes the ordering-dependent inference failure where method-syntax functions would fail to infer types when defined before the function that provides the inference source.

<details>
<summary>What changed in the compiler</summary>

The root cause was in [`src/compiler/utilities.ts:10880-10897`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/utilities.ts#L10880-L10897):

```typescript
export function hasContextSensitiveParameters(node: FunctionLikeDeclaration): boolean {
    // Functions with type parameters are not context sensitive.
    if (!node.typeParameters) {
        // Functions with any parameters that lack type annotations are context sensitive.
        if (some(node.parameters, p => !getEffectiveTypeAnnotationNode(p))) {
            return true;
        }
        if (node.kind !== SyntaxKind.ArrowFunction) {
            // If the first parameter is not an explicit 'this' parameter, then the function has
            // an implicit 'this' parameter which is subject to contextual typing.
            const parameter = firstOrUndefined(node.parameters);
            if (!(parameter && parameterIsThisKeyword(parameter))) {
                return !!(node.flags & NodeFlags.ContainsThis);
            }
        }
    }
    return false;
}
```

The key change is at line 10892: instead of unconditionally returning `true` for non-arrow functions without an explicit `this` parameter, it now checks `node.flags & NodeFlags.ContainsThis` -- a flag defined at [`src/compiler/types.ts:793`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/types.ts#L793):

```typescript
ContainsThis = 1 << 8,  // Interface contains references to "this"
```

**The [`isThislessFunctionLikeDeclaration`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/checker.ts#L13684) family** (defined at [`src/compiler/checker.ts:13664-13690`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/checker.ts#L13664-L13690)) complements this by checking type annotations:

```typescript
function isThislessFunctionLikeDeclaration(node: FunctionLikeDeclaration): boolean {
    const returnType = getEffectiveReturnTypeNode(node);
    const typeParameters = getEffectiveTypeParameterDeclarations(node);
    return (node.kind === SyntaxKind.Constructor || (!!returnType && isThislessType(returnType))) &&
        node.parameters.every(isThislessVariableLikeDeclaration) &&
        typeParameters.every(isThislessTypeParameter);
}
```

</details>

**Practical effect:**

```typescript
declare function callIt<T>(obj: {
    produce: (x: number) => T,
    consume: (y: T) => void,
}): void;

// Before 6.0: Error on y ('unknown')
// After 6.0: Works, y inferred as number
callIt({
    consume(y) { return y.toFixed(); },
    produce(x: number) { return x * 2; },
});
```

This PR fixes 9 issues: [#62204](https://github.com/microsoft/TypeScript/issues/62204), [#60986](https://github.com/microsoft/TypeScript/issues/60986), [#58630](https://github.com/microsoft/TypeScript/issues/58630), [#57572](https://github.com/microsoft/TypeScript/issues/57572), [#56067](https://github.com/microsoft/TypeScript/issues/56067), [#55489](https://github.com/microsoft/TypeScript/issues/55489), [#55124](https://github.com/microsoft/TypeScript/issues/55124), [#53924](https://github.com/microsoft/TypeScript/issues/53924), [#50258](https://github.com/microsoft/TypeScript/issues/50258).

**Potential regressions:**
- Code that previously relied on methods being deferred (context-sensitive) may now infer types earlier, potentially with less contextual information.
- VS Code had 5 new errors from this change.
- The `effect` library initially broke (but was fixed in the final PR).
- Libraries using patterns where `this`-less methods accidentally got correct types through deferred inference may see type changes.

### 4.2 Subpath Imports Starting with `#/`

**PR:** [#62844](https://github.com/microsoft/TypeScript/pull/62844) (by [magic-akari](https://github.com/magic-akari))

Node.js previously required something after `#` in subpath imports. [Node.js PR #60864](https://github.com/nodejs/node/pull/60864) added support for `#/` as a prefix. TypeScript now supports this under `node20`, `nodenext`, and `bundler` module resolution.

<details>
<summary>Implementation details</summary>

A new `ImportsPatternRoot` feature flag at [`src/compiler/moduleNameResolver.ts:1698-1707`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/moduleNameResolver.ts#L1698-L1707):

```typescript
// allowing `#/` root imports in package.json imports field
// not supported until mass adoption - https://github.com/nodejs/node/pull/60864
ImportsPatternRoot = 1 << 6,
AllFeatures = Imports | SelfName | Exports | ExportsPatternTrailers | ImportsPatternRoot,

Node16Default = Imports | SelfName | Exports | ExportsPatternTrailers,

NodeNextDefault = AllFeatures,
BundlerDefault = Imports | SelfName | Exports | ExportsPatternTrailers | ImportsPatternRoot,
```

Note that `Node16Default` does **not** include `ImportsPatternRoot`, while `NodeNextDefault` and `BundlerDefault` do. This reflects the fact that Node.js 16 doesn't support `#/`, but newer versions (20+) and bundlers do.

The guard is at [`src/compiler/moduleNameResolver.ts:2657`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/moduleNameResolver.ts#L2657):

```typescript
if (moduleName === "#" || (startsWith(moduleName, "#/") && !(state.features & NodeResolutionFeatures.ImportsPatternRoot))) {
```

When the `ImportsPatternRoot` feature is enabled, `#/` imports pass through to the imports field resolution logic instead of being rejected.

</details>

**Usage:**
```json
{
    "name": "my-package",
    "type": "module",
    "imports": {
        "#": "./dist/index.js",
        "#/*": "./dist/*"
    }
}
```

```typescript
import * as utils from "#/utils.js";
```

Supported in newer Node.js 20 releases (backported). Not available under `--moduleResolution node16` since that Node.js version predates the feature. The motivating pattern is `"imports": { "#/*": "./src/*" }` mirroring `"exports": { "./*": "./src/*" }`.

### 4.3 `--moduleResolution bundler` with `--module commonjs`

**PR:** [#62320](https://github.com/microsoft/TypeScript/pull/62320)

Previously, `--moduleResolution bundler` could only be used with `--module esnext` or `--module preserve`. Now it also allows `--module commonjs`.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/program.ts:4366-4368`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/program.ts#L4366-L4368)

```typescript
if (moduleResolution === ModuleResolutionKind.Bundler &&
    !emitModuleKindIsNonNodeESM(moduleKind) &&
    moduleKind !== ModuleKind.Preserve &&
    moduleKind !== ModuleKind.CommonJS) {
    createOptionValueDiagnostic("moduleResolution",
        Diagnostics.Option_0_can_only_be_used_when_module_is_set_to_preserve_commonjs_or_es2015_or_later, "bundler");
}
```

The addition of `moduleKind !== ModuleKind.CommonJS` means CommonJS now passes the validation.

</details>

This provides a migration path for projects deprecating `--moduleResolution node10` that still emit CommonJS.

**Recommended migration paths:**
- Bundled web apps / Bun: `--module preserve` + `--moduleResolution bundler`
- Node.js apps: `--module nodenext`
- Legacy CJS with modern resolution: `--module commonjs` + `--moduleResolution bundler` (new in 6.0)

> [!IMPORTANT]
> `--moduleResolution bundler` resolves package.json `"exports"` conditions based on the **output** module syntax. With `--module commonjs`, imports always resolve with the `"require"` condition, not `"import"`.
> - **Correct use case:** TypeScript emits CJS *before* a bundler resolves (e.g., Webpack ts-loader).
> - **Incorrect use case:** If your bundler resolves ESM imports first and then outputs CJS, use `--module preserve` or `esnext` instead.
> - `.mts` and `.cts` file extensions override `--module` -- a `.mts` file under `--module commonjs` still emits ESM and resolves with `"import"` conditions.

### 4.4 The [`--stableTypeOrdering`](https://www.typescriptlang.org/tsconfig/#stableTypeOrdering) Flag

**PR:** [#63084](https://github.com/microsoft/TypeScript/pull/63084)

A **diagnostic-only** flag to help compare TypeScript 6.0 output with TypeScript 7.0 output during migration. Not intended for long-term use.

**When to use:** Only when comparing `.d.ts` or error output between TypeScript 6.0 and 7.0 to isolate genuine differences from ordering noise.

**Performance warning:** Can add up to 25% slowdown to type-checking.

**Background:** TypeScript assigns internal type IDs in the order types are encountered. These IDs are used to sort union members. This means adding an unrelated declaration *above* a function can change the order of its inferred union return type in `.d.ts` output:

```typescript
// Without the const: foo(): 100 | 500
// With the const:    foo(): 500 | 100  (500 gets a lower type ID from being processed first)
const x = 500;
export function foo(condition: boolean) {
    return condition ? 100 : 500;
}
```

TypeScript 7.0 uses parallel type checking, which makes the encounter order non-deterministic. To fix this, 7.0 sorts types by a content-based deterministic algorithm. `--stableTypeOrdering` makes 6.0 use the same algorithm, so you can compare outputs.

<details>
<summary>Source code</summary>

**Source:** [`src/compiler/commandLineParser.ts:978-987`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L978-L987)

```typescript
{
    name: "stableTypeOrdering",
    type: "boolean",
    affectsSemanticDiagnostics: true,
    affectsBuildInfo: true,
    showInHelp: false,
    category: Diagnostics.Type_Checking,
    description: Diagnostics.Ensure_types_are_ordered_stably_and_deterministically_across_compilations,
    defaultValueDescription: false,
},
```

Note `showInHelp: false` -- this flag is intentionally hidden from `tsc --help`.

</details>

### 4.5 `tsc` with File Arguments When `tsconfig.json` Exists

**PR:** [#62477](https://github.com/microsoft/TypeScript/pull/62477) | **Issue:** [#62197](https://github.com/microsoft/TypeScript/issues/62197)

Previously, running `tsc foo.ts` in a directory with a `tsconfig.json` silently ignored the config file. This was confusing. Now it's an error:

```
error TS5112: tsconfig.json is present but will not be loaded if files are specified
on commandline. Use '--ignoreConfig' to skip this error.
```

**Migration:** If you intentionally want to compile individual files without the tsconfig, use:
```bash
tsc --ignoreConfig foo.ts
```

This change was partly motivated by AI coding agents that run `tsc foo.ts` to "save time" -- because tsconfig was silently ignored, compilation used default settings, producing irrelevant errors that the agents would then try to "fix".

<details>
<summary>Source code</summary>

**The new `--ignoreConfig` flag:** [`src/compiler/commandLineParser.ts:691-699`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/commandLineParser.ts#L691-L699)

```typescript
{
    name: "ignoreConfig",
    type: "boolean",
    showInSimplifiedHelpView: true,
    category: Diagnostics.Command_line_Options,
    isCommandLineOnly: true,
    description: Diagnostics.Ignore_the_tsconfig_found_and_build_with_commandline_options_and_files,
    defaultValueDescription: false,
},
```

**Error handling logic:** [`src/compiler/executeCommandLine.ts:624-634`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/compiler/executeCommandLine.ts#L624-L634)

```typescript
else if (!commandLine.options.ignoreConfig || commandLine.fileNames.length === 0) {
    const searchPath = normalizePath(sys.getCurrentDirectory());
    configFileName = findConfigFile(searchPath, fileName => sys.fileExists(fileName));
    if (commandLine.fileNames.length !== 0) {
        if (configFileName) {
            reportDiagnostic(createCompilerDiagnostic(
                Diagnostics.tsconfig_json_is_present_but_will_not_be_loaded_if_files_are_specified_on_commandline_Use_ignoreConfig_to_skip_this_error
            ));
            return sys.exit(ExitStatus.DiagnosticsPresent_OutputsSkipped);
        }
    }
}
```

</details>

### 4.6 `dom.iterable` and `dom.asynciterable` Merged into `dom`

**PR:** [#62111](https://github.com/microsoft/TypeScript/pull/62111) | **Issue:** [#60959](https://github.com/microsoft/TypeScript/issues/60959)

Previously, using iteration methods on DOM collections (like `NodeList`) required `"lib": ["dom", "dom.iterable"]`. Now `dom.iterable` and `dom.asynciterable` are fully included in `dom`.

The old files are now empty stubs for backward compatibility. Specifying `dom.iterable` still works (it's just empty), so no changes are strictly required.

**Migration:** You can simplify your `lib` array:
```diff
  {
      "compilerOptions": {
-         "lib": ["dom", "dom.iterable", "es2020"]
+         "lib": ["dom", "es2020"]
      }
  }
```

- The same merge also applies to **WebWorker**: `webworker.iterable` and `webworker.asynciterable` are now included in `webworker`.
- `dom` now implicitly pulls in `es2015` (for `Symbol.iterator`/`Iterable`) and `es2018.asynciterable` (for `AsyncIterable`).

<details>
<summary>Source code</summary>

[`src/lib/dom.iterable.generated.d.ts`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/lib/dom.iterable.generated.d.ts):

```typescript
// This file's contents are now included in the main types file.
// The file has been left for backward compatibility.
```

</details>

---

## 5. New Standard Library Types

### 5.1 `es2025` Target and Lib

**PR:** [#63046](https://github.com/microsoft/TypeScript/pull/63046) (by [Kenta Moriuchi / petamoriken](https://github.com/petamoriken))

While there are no new JavaScript *language features* in ES2025, this target moves several declarations from `esnext` into `es2025`:
- `Promise.try` (from `es2025.promise`)
- `Iterator` helper methods (from `es2025.iterator`)
- `Set` methods like `union`, `intersection`, `difference` (from `es2025.collection`)
- `Float16Array`, `Math.f16round`, `DataView.getFloat16`/`setFloat16` (from `es2025.float16`)
- `RegExp.escape` (from `es2025.regexp`)
- `Intl.DurationFormat` (from `es2025.intl`)

<details>
<summary>Lib reference chain</summary>

The `esnext` lib now references `es2025` as its base at [`src/lib/esnext.d.ts`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/lib/esnext.d.ts):

```typescript
/// <reference lib="es2025" />
/// <reference lib="esnext.intl" />
/// <reference lib="esnext.collection" />
/// <reference lib="esnext.decorators" />
/// <reference lib="esnext.disposable" />
/// <reference lib="esnext.array" />
/// <reference lib="esnext.error" />
/// <reference lib="esnext.sharedmemory" />
/// <reference lib="esnext.typedarrays" />
/// <reference lib="esnext.temporal" />
/// <reference lib="esnext.date" />
```

</details>

### 5.2 Temporal API Types

**PR:** [#62628](https://github.com/microsoft/TypeScript/pull/62628) (by [Renegade334](https://github.com/Renegade334))

The [TC39 Temporal proposal](https://github.com/tc39/proposal-temporal) (stage 3) types are now included under `esnext` (or the granular `esnext.temporal` lib).

This file declares the `Temporal` namespace with all its types:
- `Temporal.Instant` -- a point on the absolute timeline
- `Temporal.ZonedDateTime` -- a date/time with timezone
- `Temporal.PlainDate`, `PlainTime`, `PlainDateTime` -- civil date/time without timezone
- `Temporal.PlainYearMonth`, `PlainMonthDay` -- partial date types
- `Temporal.Duration` -- a length of time
- `Temporal.Now` -- clock access

**Usage:**
```typescript
// Requires --target esnext or "lib": ["esnext"]
let yesterday = Temporal.Now.instant().subtract({ hours: 24 });
let tomorrow = Temporal.Now.instant().add({ hours: 24 });
```

**Runtime support (as of February 2026):** Firefox 139+, Chrome 144+. See [MDN browser compatibility](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal#browser_compatibility) for current status. No custom calendar support -- only built-in (non-Gregorian) calendars per latest TC39 spec.

**Polyfill incompatibility:** `temporal-polyfill` and `@js-temporal/polyfill` are NOT interassignable with these lib declarations. The types were written de novo and use different patterns than the polyfills.

### 5.3 `Map.getOrInsert` / `Map.getOrInsertComputed`

**PR:** [#62612](https://github.com/microsoft/TypeScript/pull/62612) (by [Renegade334](https://github.com/Renegade334))

The [ECMAScript "upsert" proposal](https://github.com/tc39/proposal-upsert) (stage 4) adds two methods to `Map` and `WeakMap`.

```typescript
interface Map<K, V> {
    getOrInsert(key: K, defaultValue: V): V;
    getOrInsertComputed(key: K, callback: (key: K) => V): V;
}

interface WeakMap<K extends WeakKey, V> {
    getOrInsert(key: K, defaultValue: V): V;
    getOrInsertComputed(key: K, callback: (key: K) => V): V;
}
```

- `getOrInsert(key, defaultValue)` -- returns the existing value or inserts and returns `defaultValue`
- `getOrInsertComputed(key, callback)` -- like `getOrInsert` but computes the default lazily via callback (useful for expensive defaults)

**Usage:**
```typescript
// Before: tedious check-and-set pattern
let strictValue: unknown;
if (compilerOptions.has("strict")) {
    strictValue = compilerOptions.get("strict");
} else {
    strictValue = true;
    compilerOptions.set("strict", strictValue);
}

// After: one-liner
let strictValue = compilerOptions.getOrInsert("strict", true);
```

### 5.4 `RegExp.escape`

**PR:** [#63046](https://github.com/microsoft/TypeScript/pull/63046) (by [Kenta Moriuchi / petamoriken](https://github.com/petamoriken))

The [RegExp Escaping proposal](https://github.com/tc39/proposal-regex-escaping) (stage 4) adds `RegExp.escape()` for safely escaping special characters.

```typescript
interface RegExpConstructor {
    escape(string: string): string;
}
```

Available in the `es2025` lib (not just `esnext`).

**Usage:**
```typescript
function matchWholeWord(word: string, text: string) {
    const escapedWord = RegExp.escape(word);
    const regex = new RegExp(`\\b${escapedWord}\\b`, "g");
    return text.match(regex);
}
```

---

## 6. Breaking Behavioral Changes

Beyond the explicit deprecations and new defaults, TypeScript 6.0 has several **silent behavioral changes** that can affect your code without producing a deprecation warning:

- **Type ordering in `.d.ts` output** -- Union member ordering may differ between 6.0 and 7.0. Use `--stableTypeOrdering` to preview 7.0's ordering (see [section 4.4](#44-the---stabletypeordering-flag)).
- **Inference changes from `this`-less optimization** -- Method-syntax functions that don't use `this` now participate in inference earlier, which can change type inference results in rare cases (see [section 4.1](#41-less-context-sensitivity-on-this-less-functions)).
- **Silent `moduleResolution` default shift** -- Projects using `--module commonjs` without explicit `moduleResolution` now get `bundler` instead of `node10` (see [section 2.3](#23---moduleresolution-node--node10-deprecated)). Projects using `--module es2020` (or similar) without explicit `moduleResolution` now get `bundler` instead of `classic` (see [section 2.5](#25---module-amd-umd-system-none-deprecated)).
- **`"use strict"` always emitted** -- Non-ESM output files now unconditionally include `"use strict"` (see [section 2.8](#28---alwaysstrict-false-deprecated)).
- **`esModuleInterop` emit changes** -- Default import emit now uses `__importDefault`/`__importStar` helpers, changing runtime behavior for CJS interop (see [section 2.7](#27---esmoduleinterop-false-and---allowsyntheticdefaultimports-false-deprecated)).

---

## 7. Migration Checklist

### Priority 1: Likely Breaking for Most Projects

- [ ] **Set `"types": ["node"]`** (or whatever `@types` packages you need) in tsconfig
- [ ] **Set `"rootDir": "./src"`** if you were relying on inference and have source files in a subdirectory
- [ ] **Review the new `strict: true` default** -- either embrace it or set `"strict": false` explicitly

### Priority 2: Common Adjustments

- [ ] Set explicit `target` if you need something other than `es2025`
- [ ] Set explicit `module` if you need `commonjs` output
- [ ] Remove `baseUrl` and inline its value into `paths` entries
- [ ] Replace `import * as x from "cjs-module"` with `import x from "cjs-module"` (esModuleInterop always on)
- [ ] Replace `import ... assert { }` with `import ... with { }`
- [ ] Replace `module Foo { }` with `namespace Foo { }`
- [ ] Update any scripts that run `tsc` with file arguments (now errors if `tsconfig.json` exists; use `--ignoreConfig`)
- [ ] If you have side-effect imports that don't resolve, set `"noUncheckedSideEffectImports": false`
- [ ] If you use `@typescript/lib-*` replacement packages, set `"libReplacement": true`

### Priority 3: Deprecated Options to Remove

- [ ] Remove `downlevelIteration`
- [ ] Remove or update `moduleResolution` from `node`/`node10`/`classic` to `nodenext`/`bundler`
- [ ] Remove or update `module` from `amd`/`umd`/`system`/`none`
- [ ] Remove `outFile` and adopt a bundler
- [ ] Remove `alwaysStrict: false`
- [ ] Remove `esModuleInterop: false`
- [ ] Remove `allowSyntheticDefaultImports: false`
- [ ] Remove `/// <reference no-default-lib="true"/>`

### Priority 4: Quick Wins

- [ ] Simplify `"lib": ["dom", "dom.iterable"]` to `"lib": ["dom"]`
- [ ] Consider adopting `es2025` target to get `RegExp.escape` types
- [ ] Try the new [`getOrInsert`/`getOrInsertComputed`](https://github.com/microsoft/TypeScript/blob/b24015058ae060de249acf5ea09e15dd92a55587/src/lib/esnext.collection.d.ts#L9-L15) methods on `Map`

### Temporary Escape Hatch

If you need to defer migration, add:
```json
{
    "compilerOptions": {
        "ignoreDeprecations": "6.0"
    }
}
```

This silences all 6.0 deprecation warnings but **will not work in TypeScript 7.0**.

### Automated Migration with `ts5to6`

The [`ts5to6` tool](https://github.com/andrewbranch/ts5to6) (by [Andrew Branch](https://github.com/andrewbranch), a TypeScript team member) automates the two most disruptive tsconfig migrations: `baseUrl` removal and `rootDir` inference. It works across monorepos, follows project references, and handles `extends` chains.

**Install and run:**

```bash
npx @andrewbranch/ts5to6 --fixBaseUrl .
npx @andrewbranch/ts5to6 --fixRootDir .
```

The argument is a path to a `tsconfig.json` or a directory containing one. Only one fix mode can be run at a time.

#### `--fixBaseUrl` (`-b`)

Removes `baseUrl` from your tsconfig(s) and rewrites `paths` entries to be relative to the tsconfig directory instead of relative to `baseUrl`. Handles these cases:

- **Non-relative paths** like `"components/*": ["components/*"]` get rewritten to `"components/*": ["./src/components/*"]` (where `./src` was the old `baseUrl`)
- **Wildcard catch-all** `"*": ["./src/*"]` is added if any module resolution actually depended on `baseUrl` as a lookup root (detected by running the TypeScript compiler and checking for resolution failures)
- **`extends` in `node_modules`**: If a base config in `node_modules` sets `baseUrl`, the tool sets `"baseUrl": null` in your config to clear the inherited value (since you can't edit `node_modules`)
- **Inherited `paths`**: When `paths` are defined in a base config and `baseUrl` changes, the tool copies and transforms the path mappings into the local config

#### `--fixRootDir` (`-r`)

Sets an explicit `rootDir` matching what TypeScript 5.9 would have inferred, so your output directory structure stays the same. The tool:

1. Creates a TypeScript program for each affected project
2. Compares the old inferred root (common source directory) with the new default (tsconfig directory)
3. If they differ, adds `"rootDir": "./src"` (or whatever the old value was) to the tsconfig
4. Skips `composite` projects (they already had this behavior) and `outFile` projects

#### How it works under the hood

The tool uses a vendored, patched TypeScript compiler that emits special error signals when it detects `baseUrl`-dependent module resolution or `rootDir` inference mismatches. It discovers all tsconfigs in your workspace (by searching upward for `package.json`, then globbing for `**/tsconfig*.json`), recursively follows project references, and applies surgical JSON AST edits that preserve formatting, indentation, and trailing commas.

---

## Appendix: All Referenced Pull Requests

| PR | Title | Author |
|----|-------|--------|
| [#62111](https://github.com/microsoft/TypeScript/pull/62111) | Merge `dom.iterable` and `dom.asynciterable` into `dom` | TypeScript team |
| [#62243](https://github.com/microsoft/TypeScript/pull/62243) | Less context-sensitivity on `this`-less functions | [Andarist](https://github.com/Andarist) |
| [#62320](https://github.com/microsoft/TypeScript/pull/62320) | Allow `--moduleResolution bundler` with `--module commonjs` | TypeScript team |
| [#62338](https://github.com/microsoft/TypeScript/pull/62338) | Deprecate `--moduleResolution node10` | TypeScript team |
| [#62418](https://github.com/microsoft/TypeScript/pull/62418) | Default `rootDir` to tsconfig.json directory | TypeScript team |
| [#62435](https://github.com/microsoft/TypeScript/pull/62435) | Deprecate `no-default-lib` directive | TypeScript team |
| [#62477](https://github.com/microsoft/TypeScript/pull/62477) | Error when `tsc` has file args with tsconfig present | TypeScript team |
| [#62509](https://github.com/microsoft/TypeScript/pull/62509) | Deprecate `baseUrl` | TypeScript team |
| [#62567](https://github.com/microsoft/TypeScript/pull/62567) | Deprecate `esModuleInterop: false` and `allowSyntheticDefaultImports: false` | TypeScript team |
| [#62612](https://github.com/microsoft/TypeScript/pull/62612) | Add `getOrInsert`/`getOrInsertComputed` types | [Renegade334](https://github.com/Renegade334) |
| [#62628](https://github.com/microsoft/TypeScript/pull/62628) | Add Temporal API types | [Renegade334](https://github.com/Renegade334) |
| [#62669](https://github.com/microsoft/TypeScript/pull/62669) | Deprecate `module: amd/umd/system/none` and `moduleResolution: classic` | TypeScript team |
| [#62844](https://github.com/microsoft/TypeScript/pull/62844) | Support subpath imports starting with `#/` | [magic-akari](https://github.com/magic-akari) |
| [#62876](https://github.com/microsoft/TypeScript/pull/62876) | Deprecate legacy `module` keyword for namespaces | TypeScript team |
| [#62981](https://github.com/microsoft/TypeScript/pull/62981) | Deprecate `outFile` | TypeScript team |
| [#63046](https://github.com/microsoft/TypeScript/pull/63046) | Add `es2025` target/lib with `RegExp.escape` | [petamoriken](https://github.com/petamoriken) |
| [#63054](https://github.com/microsoft/TypeScript/pull/63054) | Default `types` to `[]` | TypeScript team |
| [#63067](https://github.com/microsoft/TypeScript/pull/63067) | Deprecate `target: es5` | TypeScript team |
| [#63071](https://github.com/microsoft/TypeScript/pull/63071) | Deprecate `downlevelIteration` | TypeScript team |
| [#63077](https://github.com/microsoft/TypeScript/pull/63077) | Deprecate `asserts` keyword on imports | TypeScript team |
| [#63084](https://github.com/microsoft/TypeScript/pull/63084) | Add `--stableTypeOrdering` flag | TypeScript team |
| [#63089](https://github.com/microsoft/TypeScript/pull/63089) | Deprecate `alwaysStrict: false` | TypeScript team |

## Appendix: Referenced GitHub Issues

| Issue | Title |
|-------|-------|
| [#60959](https://github.com/microsoft/TypeScript/issues/60959) | Merge `dom.iterable` into `dom` |
| [#62194](https://github.com/microsoft/TypeScript/issues/62194) | Default `rootDir` to `.` |
| [#62195](https://github.com/microsoft/TypeScript/issues/62195) | Default `types` to `[]` |
| [#62196](https://github.com/microsoft/TypeScript/issues/62196) | Deprecate `target: es5` |
| [#62197](https://github.com/microsoft/TypeScript/issues/62197) | Error on `tsc` with files + tsconfig |
| [#62199](https://github.com/microsoft/TypeScript/issues/62199) | Deprecate `module: amd/umd/system` |
| [#62200](https://github.com/microsoft/TypeScript/issues/62200) | Deprecate `moduleResolution: node10` |
| [#62206](https://github.com/microsoft/TypeScript/issues/62206) | Deprecate `moduleResolution: classic` |
| [#62207](https://github.com/microsoft/TypeScript/issues/62207) | Deprecate `baseUrl` |
| [#62209](https://github.com/microsoft/TypeScript/issues/62209) | Deprecate `no-default-lib` directive |
| [#62210](https://github.com/microsoft/TypeScript/issues/62210) | Deprecate `asserts` on imports |
| [#62211](https://github.com/microsoft/TypeScript/issues/62211) | Deprecate legacy `module` keyword |
| [#62213](https://github.com/microsoft/TypeScript/issues/62213) | Deprecate `alwaysStrict: false` |
| [#62529](https://github.com/microsoft/TypeScript/issues/62529) | Deprecate `esModuleInterop: false` |
| [#54500](https://github.com/microsoft/TypeScript/issues/54500) | TypeScript 6.0/7.0 deprecation tracking |

## Resources

| Resource | Link |
|----------|------|
| 6.0 Beta announcement | [devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/) |
| 6.0 Iteration Plan | [microsoft/TypeScript#63085](https://github.com/microsoft/TypeScript/issues/63085) |
| 6.0 Maintenance Mode announcement | [microsoft/TypeScript#62963](https://github.com/microsoft/TypeScript/issues/62963) |
| LS bugs bulk-close explanation | [microsoft/TypeScript#62827](https://github.com/microsoft/TypeScript/issues/62827) |
| TypeScript Native Nightly (VS Code) | [marketplace.visualstudio.com](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) |
| typescript-go repo | [github.com/microsoft/typescript-go](https://github.com/microsoft/typescript-go) |
| 6.0/7.0 Deprecation Candidates | [microsoft/TypeScript#54500](https://github.com/microsoft/TypeScript/issues/54500) |
| Migration tool (`ts5to6`) | [github.com/andrewbranch/ts5to6](https://github.com/andrewbranch/ts5to6) |
| Migration info (`aka.ms/ts6`) | [aka.ms/ts6](https://aka.ms/ts6) |
| TypeScript 7 native port progress | [devblogs.microsoft.com/.../progress-on-typescript-7-december-2025](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/) |
| Native preview package | [npmjs.com/package/@typescript/native-preview](https://www.npmjs.com/package/@typescript/native-preview) |
