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
