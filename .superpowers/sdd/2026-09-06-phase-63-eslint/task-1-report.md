# Task 1 report: Flat config on ESLint 9, at parity

## Status

Complete. All four gates green, L2 golden-master replay passes, zero source
files changed (nothing surfaced that needed a non-semantic fix).

## Commit

`f0493fb05acd155fea92ba97af508a801ca38330` (branch `modernize-p63-eslint`,
parent `778a097f30de163fc59f21b58a7aa4104a1b88ed`).

## Four gate exit codes (Step 6)

| gate | exit code |
| --- | --- |
| `npm run lint` | 0 |
| `npm run format:check` | 0 |
| `npx tsc --noEmit` | 0 |
| `npm test` | 0 (174 tests passed, 24 files) |

Each was checked with a standalone `echo $?`, never through a pipe.

## L2 replay result

```
npm run build                                    -> exit 0
cd e2e && npm ci --prefer-offline (Node v20)      -> exit 0
./setup.sh --subject-only                         -> exit 0
SUBJECT_ONLY=1 npm run replay                     -> exit 0

  ✓ 1 [replay] › the fixture inputs match what the oracle was captured from
  ✓ 2 [replay] › the build under test reproduces the oracle exactly
  2 passed (7.3s)
```

The build under test reproduces the December 2021 oracle exactly.

## Parity table (Step 5)

Baseline (before, `src/db.ts`): 116 active rules. After: 107 active rules.
9 lost, 0 gained.

| rule | lost? | disposition |
| --- | --- | --- |
| `flowtype/define-flow-type` | yes | **Expected** — no Flow in this project (per brief) |
| `flowtype/require-valid-file-annotation` | yes | **Expected** — no Flow in this project |
| `flowtype/use-flow-type` | yes | **Expected** — no Flow in this project |
| `prettier/prettier` | yes | **Expected** — Prettier now runs as its own check (`npm run format` / `format:check`), decoupled from ESLint per #76 |
| `dot-location` | yes | **Justified, not restored** — see below |
| `new-parens` | yes | **Justified, not restored** — see below |
| `no-mixed-operators` | yes | **Justified, not restored** — see below |
| `no-whitespace-before-property` | yes | **Justified, not restored** — see below |
| `rest-spread-spacing` | yes | **Justified, not restored** — see below |

No rule gained (0). All 107 core/react/react-hooks/jsx-a11y/@typescript-eslint/import
rules that were active before are still active after, at identical severity
and options — the entire non-flowtype, non-prettier rule set (112 rules,
matching the brief's stated baseline breakdown exactly) was transcribed
verbatim from `before-source.json` into `eslint.config.mjs`.

**Justification for the 5 unexpected-looking losses.** `eslint-config-prettier`
is placed last in the config, per Step 3's explicit instruction, "so it can
turn off stylistic rules that would fight Prettier." It turns off exactly
these 5 rules because each duplicates something Prettier's own formatter
already normalizes — verified directly by running the offending construct
through `prettier --parser typescript`:

| rule | violating input | prettier output |
| --- | --- | --- |
| `new-parens` | `new Foo` | `new Foo()` |
| `no-whitespace-before-property` | `foo .bar` | `foo.bar` |
| `rest-spread-spacing` | `{... spread}` | `{ ...spread }` |
| `no-mixed-operators` | `a && b \|\| c` | `(a && b) \|\| c` |
| `dot-location` | long chain wrapped across lines | dot always kept with the property, never dangling |

This is the same architectural move that justifies losing `prettier/prettier`
itself: formatting concerns move out of ESLint into `npm run format:check`,
which is unaffected (still passes, 0 files need reformatting) and covers the
same ground these 5 rules did. Since `npm run format:check` was green both
before and after, and these constructs are provably normalized by Prettier,
this is not a narrowing of the effective lint surface a developer would
notice — it is a relocation of the same guarantee, exactly parallel to
`prettier/prettier`'s move.

I chose not to reorder the config to preserve these 5 rules (e.g. putting the
explicit rule block after `eslint-config-prettier`) because doing so would
contradict the brief's explicit instruction and reintroduce exactly the
rule/formatter fights `eslint-config-prettier` exists to prevent.

Test-file config (`src/formulas.test.ts`) also shows 0 `jest/*` and
`testing-library/*` rules active, matching established fact #4 — restoring
test-file coverage is out of scope for Task 1 (tracked separately, per the
brief's stated architecture).

## `npm run format` — files changed

None. `npm run format:check` (both the old narrow glob and the corrected
`./src/**/*.{js,jsx,ts,tsx,css,scss}` glob) reported "All matched files use
Prettier code style!" with exit 0. No pre-existing drift was found, so
`npm run format` (write mode) was not needed.

## `eslint-plugin-react-hooks` version and why

Installed `eslint-plugin-react-hooks@^7.1.1` (latest). Its `recommended`
config bundles the new React Compiler-derived rules (`set-state-in-effect`,
`purity`, `immutability`, `refs`, etc. — 20+ rules beyond the original two),
which would be noisy and out of scope. Rather than hunting for an older major
whose `recommended` preset happens to contain exactly two rules, the config
does not spread any preset for this plugin at all — it registers the plugin
and enables only `react-hooks/rules-of-hooks` (error) and
`react-hooks/exhaustive-deps` (warn) explicitly, matching the two rules that
were active before. This sidesteps the version-pinning question entirely and
stays correct regardless of what future `recommended` exports contain.

## Rules disabled rather than complied with

None. Zero new errors or warnings surfaced from the typescript-eslint 4 → 8
upgrade (or from any other plugin bump) on this codebase — `npm run lint`
reports 0 problems on all 59 `src/**/*.{ts,tsx}` files, identical to the
pre-migration baseline (which was also fully clean apart from the two
informational jsx-ast-utils `MetaProperty` console lines, present unchanged
before and after). The brief anticipated typescript-eslint 8 would "find real
things" via the same rule IDs running under 4 more major versions of engine
logic; empirically, on this specific codebase, it did not. No source file
was touched and no rule needed to be disabled.

## Other notes / deviations

- **Node version.** The shell's active `node` was v20.14.0 at the start of
  this task, but the repo root `.nvmrc` specifies `v22`. Switched to
  v22.23.2 (via `nvm use 22`) for all root-level commands, per the brief's
  global constraint "Node from `.nvmrc`." The `e2e/` workspace has its own
  `.nvmrc` pinning `v20`; its `npm ci` / `setup.sh` / `replay` commands were
  run under Node v20.14.0 (via `nvm use 20`), matching that workspace's own
  pin.
- **`eslint-plugin-testing-library@^3.9.2`** remains in `devDependencies`,
  untouched — it was not in the brief's remove list for Task 1 (only
  `eslint-config-react-app`, `babel-eslint`, `eslint-plugin-flowtype`,
  `eslint-plugin-prettier`, `@typescript-eslint/eslint-plugin`,
  `@typescript-eslint/parser`, `eslint-plugin-jest` were). It is not
  referenced by `eslint.config.mjs` (consistent with established fact #4 —
  it was already inert) and `npm ls` reports it as an invalid peer against
  ESLint 9 (it wants `^5 || ^6 || ^7`). This does not affect any of the four
  gates or the L2 replay; upgrading it to v7 is presumably a later task's
  scope (restoring test-file lint coverage, the actual ask of #63).
- **`prettier`** moved from `dependencies` to `devDependencies` in
  `package.json`, version left untouched at `2.2.1`, per the brief.
- **`eslintConfig` block** deleted from `package.json`; the `prettier` block
  (Prettier's own config) was left in place.
- Established facts #1–#5 in the brief were all re-verified independently
  before making any change (peer ranges, ESLint 9 vs 10 plugin ceilings,
  zero test-file rules, and the exact 116-rule/8-plugin baseline breakdown)
  and all checked out exactly as stated — no discrepancies found.

## Files touched

- `package.json` — dependency swap, `prettier` moved to devDependencies,
  `eslintConfig` block removed, `format`/`format:check` scripts added/fixed,
  `lint` script unchanged.
- `package-lock.json` — regenerated by the dependency swap.
- `eslint.config.mjs` — new flat config (created).
- No files under `src/` were changed. `src/data.csv` and
  `src/golden/expected.json` are untouched (verified via
  `git status --porcelain`).
