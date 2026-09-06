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

