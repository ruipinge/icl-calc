# ESLint stack modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Restore lint coverage for test files — the actual ask of #63 — which
requires replacing the ESLint stack, because every plugin that can do it needs
ESLint ≥ 8.57 and this project is on 7.32.

**Architecture:** `eslint-config-react-app` is a Create React App artifact,
unmaintained, and the last CRA remnant in the repo. It is replaced by an
explicit flat config that names every plugin it uses. Prettier moves out of
ESLint into its own check, which decouples the Prettier version from this
upgrade entirely (#76).

**Tech Stack:** ESLint 9.39.5 (flat config), typescript-eslint 8,
eslint-plugin-testing-library 7, `@vitest/eslint-plugin`, React 19, Vitest 1.6.

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
**Issue:** #63

## Global Constraints

- `src/data.csv` and `src/golden/expected.json` must not change. CI-gated,
  spec §7.3 stop rule.
- **No behaviour change.** This phase touches lint config and, where lint
  demands it, source. Any source edit must be provably non-semantic: the L2
  browser replay must still reproduce the December 2021 oracle exactly.
- **Do not upgrade Prettier.** It stays pinned at 2.2.1. It cannot parse TS
  ≥ 4.9 (#76) and upgrading reformats every file — a separate decision the
  owner has deferred. This phase makes that decision *possible* by removing
  `eslint-plugin-prettier`; it does not take it.
- Do not change `vite.config.ts` coverage settings or thresholds (#46).
- Node from `.nvmrc`. Browser floor unchanged.
- Conventional commits. No `BREAKING CHANGE:`/`!` — the 2.0.0 declaration
  belongs to the `modernize` → `master` merge (#52).

---

## Established facts — verified, do not re-derive

Checked against the registry and the installed tree on 2026-09-06.

**1. The issue's preferred fix is unreachable on ESLint 7.** Peer ranges:

| package | needs |
| --- | --- |
| `@vitest/eslint-plugin` | `eslint >=8.57.0` |
| `eslint-plugin-testing-library@7` | `^8.57.0 \|\| ^9 \|\| ^10` |
| `typescript-eslint@8` | `^8.57.0 \|\| ^9 \|\| ^10` |

Installed: `eslint@7.32.0`. So "just re-enable the rules" cannot use the
Vitest plugin at all.

**2. Target ESLint 9.39.5, NOT 10.** ESLint 10.10.0 exists, but
`eslint-plugin-react@7.37.5` caps at `^9.7` and `eslint-plugin-jsx-a11y@6.10.2`
caps at `^9`. Going to 10 drops React and accessibility linting.

**3. Prettier — not the TS parser — is what blocks modern TypeScript.**
`@typescript-eslint/parser@4.33` parses `satisfies` fine. `prettier@2.2.1`
throws `SyntaxError: ',' expected`. Tracked separately as #76; **out of scope
here**. Recorded because the obvious guess is wrong and costs time.

**4. Zero test-file rules are active today.** `eslint --print-config
src/formulas.test.ts` → 0 `jest/*`, 0 `testing-library/*`. The plugins are
installed (as peers of `eslint-config-react-app@6`) but nothing references
them, so they are inert.

**5. Parity baseline — 116 active rules** on a source file
(`src/db.ts`):

| plugin | active |
| --- | --- |
| core | 68 |
| jsx-a11y | 17 |
| react | 14 |
| @typescript-eslint | 7 |
| import | 4 |
| flowtype | 3 |
| react-hooks | 2 |
| prettier | 1 |

`flowtype` is Flow. This project has no Flow. Those three rules go and are
not replaced.

---

## Task 1: Flat config on ESLint 9, at parity

The upgrade and the config rewrite cannot be split — the moment ESLint is 9,
`eslintConfig` in `package.json` stops being read.

**Files:** `package.json`, `package-lock.json`, create `eslint.config.mjs`

- [ ] **Step 1: Capture the baseline before changing anything**

This is the golden-master discipline applied to lint config: you cannot claim
parity you did not measure.

```bash
W=.superpowers/sdd/2026-09-06-phase-63-eslint
mkdir -p "$W"
npx eslint --print-config src/db.ts > "$W/before-source.json"
npx eslint --print-config src/formulas.test.ts > "$W/before-test.json"
npm run lint > "$W/before-lint.txt" 2>&1 ; echo $?
```

Report the exit code. It must be 0 — you are starting from green.

- [ ] **Step 2: Swap the dependencies**

Run installs in the background and poll; a foreground npm command that goes
quiet for minutes gets killed by a stall watchdog.

Remove: `eslint-config-react-app`, `babel-eslint`, `eslint-plugin-flowtype`,
`eslint-plugin-prettier`, `@typescript-eslint/eslint-plugin`,
`@typescript-eslint/parser`, `eslint-plugin-jest`.

Add (devDependencies): `eslint@^9.39.5`, `typescript-eslint@^8`,
`eslint-plugin-react@^7.37`, `eslint-plugin-react-hooks`,
`eslint-plugin-jsx-a11y@^6.10`, `eslint-plugin-import`,
`eslint-config-prettier@^10`, `globals`.

**`prettier` and `eslint-plugin-prettier` are currently in `dependencies`,
not `devDependencies`** — a pre-existing error. Move `prettier` to
devDependencies while you are here. Do NOT change its version.

On `eslint-plugin-react-hooks`: latest is 7.x and includes React Compiler
rules that will be noisy. Enable **only** `rules-of-hooks` (error) and
`exhaustive-deps` (warn) to match today's two active rules. If v7's config
presets pull in more, pin to a version whose `recommended` is just those two,
and say in your report which you used and why.

- [ ] **Step 3: Write `eslint.config.mjs`**

`.mjs`, not `.js` — `package.json` has no `"type": "module"`, so a `.js` flat
config would be parsed as CJS.

Requirements:
- Ignore `build/`, `coverage/`, `node_modules/`, `e2e/` (the e2e workspace has
  its own tree and tsconfig; linting it from here resolves nothing).
- TypeScript + JSX parsing for `src/**/*.{ts,tsx}`.
- Browser globals for source; add Vitest globals for test files (the project
  sets `test.globals: true` in `vite.config.ts`, so `describe`/`it`/`expect`
  are ambient and will otherwise all report `no-undef`).
- React 19: set `settings.react.version` to `'detect'`, and do **not** enable
  `react/react-in-jsx-scope` (the new JSX transform makes it wrong).
- `eslint-config-prettier` **last**, so it can turn off stylistic rules that
  would fight Prettier.
- Carry `sort-imports` across **verbatim**. Copy the options object exactly
  from `package.json`'s `eslintConfig` — `ignoreCase: false`,
  `ignoreDeclarationSort: false`, `ignoreMemberSort: false`,
  `memberSyntaxSortOrder: ['none','all','multiple','single']`,
  `allowSeparatedGroups: false`. Every import block in this repo is ordered
  to that exact rule; changing it churns every file.

Delete the `eslintConfig` block from `package.json`. Leave the `prettier`
block — that is Prettier's own config, still used.

- [ ] **Step 4: Move Prettier to its own check**

`eslint-plugin-prettier` is gone, so formatting is no longer enforced by lint.
Replace it with a real script in `package.json`:

```json
"format:check": "prettier --check './src/**/*.{js,jsx,ts,tsx,css,scss}'",
"format": "prettier --write './src/**/*.{js,jsx,ts,tsx,css,scss}'"
```

Note the existing `format` script only matches `./src/**.{js,jsx,ts,tsx}` —
a single `*`, which misses every nested directory. Fix it as above.

Run `npm run format:check`. If it reports files needing formatting, that is
pre-existing drift the old ESLint rule was masking or the old glob missed —
run `npm run format`, and **report exactly which files changed and why**.

- [ ] **Step 5: Prove parity, then fix what surfaces**

```bash
npx eslint --print-config src/db.ts > "$W/after-source.json"
npm run lint > "$W/after-lint.txt" 2>&1 ; echo $?
```

Compare `before-source.json` and `after-source.json` at the level of *which
rules are active*, not raw JSON (the shape differs between eslintrc and flat).
Write the comparison into your report as a table: rules active before and not
after, and vice versa.

Expected losses, all acceptable: the three `flowtype` rules (no Flow here) and
`prettier/prettier` (now its own check). **Anything else lost is a
regression** — either restore it or justify it explicitly in the report.

Then fix the errors the new stack reports. typescript-eslint 8 is four majors
newer and will find real things. For each fix, the constraint is that it must
be non-semantic. If a rule demands a change you cannot make without altering
behaviour, disable that rule with an inline comment explaining why, and list
it in your report rather than changing the code.

- [ ] **Step 6: Gates**

```bash
npm run lint       ; echo $?
npm run format:check ; echo $?
npx tsc --noEmit   ; echo $?
npm test           ; echo $?
```

All 0. Check each with a standalone `echo $?`, never through a pipe — a
pipeline returns the last command's status and that has hidden a real lint
failure on this project twice.

- [ ] **Step 7: L2 golden master**

Any source file you touched must be proven non-semantic.

```bash
npm run build
cd e2e && npm ci --prefer-offline && ./setup.sh --subject-only
SUBJECT_ONLY=1 npm run replay
```

Both tests must pass.

- [ ] **Step 8: Commit**

---

## Task 2: The actual #63 — test-file rules

**Files:** `eslint.config.mjs`, `package.json`, test files as needed

- [ ] **Step 1: Add the plugins**

```bash
npm install -D eslint-plugin-testing-library@^7 @vitest/eslint-plugin
```

- [ ] **Step 2: Enable them for test files only**

A flat-config block scoped to `src/**/*.{test,spec}.{ts,tsx}`:
- `@vitest/eslint-plugin` recommended, which is the modern equivalent of the
  `jest/*` rules `react-app/jest` used to supply. Map deliberately: the old
  set was `no-conditional-expect`, `no-identical-title`,
  `no-interpolation-in-snapshots`, `no-jasmine-globals`, `no-jest-import`,
  `no-mocks-import`, `valid-describe`, `valid-expect`,
  `valid-expect-in-promise`, `valid-title`. Say in your report which have a
  Vitest equivalent, which do not, and which you dropped as runner-specific.
- `eslint-plugin-testing-library` — these are runner-agnostic (they lint DOM
  Testing Library usage) and map almost directly. `no-dom-import` takes
  `['error', 'react']`.

- [ ] **Step 3: Run it and expect real errors**

Run: `npm run lint`
Expected: FAIL, across roughly twenty test files. This is the churn #63 says
Task 4 of Phase 3a deliberately deferred. It is the point of the phase, not a
setback.

- [ ] **Step 4: Fix them, and read each one**

Do not blanket-disable. Each error is a real finding about a real test, and
this project has already found five tests that asserted nothing. If a rule
flags something that turns out to be a test not testing what it claims, say
so loudly in your report — that is worth more than the lint fix.

Where a rule is genuinely wrong for this codebase, disable it in
`eslint.config.mjs` with a comment giving the reason, not inline per-file.

- [ ] **Step 5: Prove the rules are live**

A rule that is configured but not firing is worth nothing. Pick two — one
`testing-library/*` and one `vitest/*` — write a temporary violation into a
test file, confirm lint goes red naming that rule, remove it, confirm green.
Report both.

- [ ] **Step 6: Gates and commit**

Same four gates as Task 1 Step 6, plus `npm test` must still be **174 passed,
none skipped**.

---

## Task 3: CI and documentation

**Files:** `.github/workflows/main.yml`, spec, findings

- [ ] **Step 1: Add the format check to CI**

Formatting is no longer enforced by `npm run lint`, so without this the
project silently stops checking it. Add a step after `Lint`:

```yaml
      - name: Format check
        run: npm run format:check
```

- [ ] **Step 2: Reconcile the docs**

Spec: record that `eslint-config-react-app` is gone — the last CRA remnant —
and why ESLint 9 rather than 10 (`eslint-plugin-react` caps at `^9.7`).
Findings: annotate in place per that document's convention.

State plainly that Prettier is unchanged and why (#76), so the next reader
does not assume it was overlooked.

- [ ] **Step 3: Verify nothing stale**

```bash
grep -rn "react-app\|eslintConfig\|babel-eslint\|flowtype" package.json docs/ .github/
```

Every hit must be historical text under an annotation, or gone.

- [ ] **Step 4: Commit**

---

## Done when

1. `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm test` all 0.
2. `npm test` still reports 174 passed, none skipped.
3. L2 replay reproduces the oracle exactly.
4. Test files have active `testing-library/*` and `vitest/*` rules, proven by
   deliberate violation.
5. No rule active before is silently inactive after, except the three
   `flowtype` rules and `prettier/prettier`.
6. `eslint-config-react-app`, `babel-eslint` and `eslint-plugin-flowtype` are
   gone from `package.json`.
7. Prettier is still 2.2.1.
