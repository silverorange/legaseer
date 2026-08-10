# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@silverorange-inc/legaseer` is a CLI file watcher for legacy silverorange PHP projects. It is
published to npm and consumed by those projects as a dev dependency (`bin: legaseer` →
`dist/legaseer.js`). It has no runtime of its own — it shells out to `lessc`, `php -l`, and
`composer` in the *consuming* project's working directory.

## Commands

Package manager is **pnpm** (pinned via `packageManager`; CI uses corepack).

```
pnpm install --frozen-lockfile
pnpm build          # tsc → dist/ (also runs on prepublish)
pnpm lint           # eslint src/**/*.ts
pnpm prettier       # check formatting; pnpm prettier:write to fix
pnpm start          # tsx src/legaseer.ts — runs the watcher against CWD
```

There is **no test suite**. CI (`.github/workflows/pull-requests.yaml`) runs exactly
`pnpm lint && pnpm prettier && pnpm build` — run those three before considering a change done.

`pnpm start` only does something useful when the CWD is a legacy silverorange PHP project (see
"Assumed project layout"). Running it here watches nothing.

## Architecture

ESM throughout (`"type": "module"`, `module: NodeNext`) with `strict` TypeScript. Relative imports
must carry the `.js` extension even in `.ts` sources. `src/legaseer.ts` uses top-level `await`.

`src/legaseer.ts` is the whole control flow, and reads top-to-bottom as the lifecycle:

1. **Lock** — `proper-lockfile` on `./`. A second watcher in the same project exits 1 (`ELOCKED`).
2. **Symlinks** — `setupSymlinks()` runs *before* path discovery, because the discovered watch paths
   follow those symlinks.
3. **Path discovery** — `getPhpWatchPaths.ts` resolves globs to explicit file lists. This is
   deliberate: chokidar chokes on the circular symlinks found in project `www` directories, so
   `www/*.php` and symlinked vendor packages are expanded eagerly via globby. The tradeoff is that
   **newly created files in those locations are not picked up** until restart.
4. **Watch** — one chokidar watcher, one `'all'` handler dispatching on file extension. A `ready`
   flag suppresses work during chokidar's initial `add` storm; the `'ready'` handler then does the
   one-time full build. `ready` is also guarded against firing twice (it does on Linux).
5. **Shutdown** — `teardownSymlinks()`, a final `composer dump-autoload`, then release the lock.
   Because SIGINT does not propagate correctly when launched via yarn, stdin is put in raw mode and
   Ctrl+C is caught as a keypress; SIGINT/SIGTERM handlers exist as a fallback.

### Work scheduling

All side-effecting work goes through `queue(key, fn)` in `hashQueue.ts` — a fire-and-forget,
per-key coalescing queue. Per key, at most one task runs and at most one is pending; a task queued
while another is pending is **dropped**, not appended. That is the point: rapid edits collapse into
one rebuild. Key choice therefore determines coalescing granularity — `'classmap'` and `'compile'`
are global (all PHP edits share one autoload rebuild), while lint and LESS compile keys embed the
path (`lint${path}`, `compile${path}`) so files serialize independently. Errors are caught and
logged inside the queue; they never reject to the caller.

### LESS compilation

`compileLess.ts` maintains reverse dependency tracking that `lessc` does not give us. The watcher
keeps a live `Set` of every known `.less` file; on change, `getDependencies()` re-reads all of them,
parses `@import` statements by regex, and walks the graph *backwards* to find every file that
transitively imports the changed one — then recompiles all of them. Imports may omit the `.less`
extension, and `url()` imports are deliberately not matched (we only care about dependents).

Compiled output goes to `www/compiled/…` with the first path segment stripped, and URLs are rebased
through postcss (`@csstools/postcss-rebase-url`) to stay valid from the new location.
`writeCompiledFlag()` then stamps `www/.concentrate-compiled` with a unix timestamp — this is what
tells `SiteHtmlHeadEntrySetDisplayer` server-side to serve compiled paths.

### Exit codes are load-bearing

`execFile.ts` wraps `child_process.execFile`; failures are distinguished by numeric `code`, and the
distinction is per-tool:

- `lessc` exit **1** = a compile error in the user's LESS → log it and continue. Anything else rethrows.
- `php -l` exit **255** = syntax errors found → parse them out of *stdout* and log. Anything else rethrows.

Getting these wrong turns an ordinary user typo into a crashed watcher.

### Symlink mode (`--symlinks=pkg1,pkg2`)

Opt-in via CLI flag (parsed in `getSymlinks.ts` with minimist + zod). For each named package found
under `vendor/silverorange` or `vendor/hippo`, the installed composer directory is renamed to
`<pkg>.original` and replaced with a symlink to `/so/packages/<pkg>/<project-dir-name>` — the
developer's live checkout. Teardown reverses this on shutdown.

This mutates the consuming project's `vendor/` directory, so **shutdown must run**. A hard kill
leaves the project with symlinks in place and `.original` directories stranded; teardown is
idempotent and will repair that on the next clean run.

## Conventions

`src/paths.ts` is the single source of truth for every project-layout assumption (watch globs,
vendor dirs, output locations, the `.original` suffix). New hardcoded paths belong there, not
inline.

Lint config extends `@silverorange-inc/eslint-config-node`; prettier is `singleQuote: true`.

### Assumed project layout

The consuming project is expected to have `include/`, `system/`, `newsletter/`, `www/`,
`www/styles/`, `www/packages/*/styles/`, a composer `vendor/` with `silverorange` and/or `hippo`
subdirectories, and (for symlink mode) live checkouts under `/so/packages/`.
