# SDD ledger — plan: docs/superpowers/plans/2026-09-06-phase-63-eslint.md

Worktree: /Users/ruipinge/dripcil/icl-calc-p63
Branch: modernize-p63-eslint (from modernize @ 4ee0333)
Issue: #63

## Pre-flight scan

| Check | Finding |
| --- | --- |
| T1 → T2 | T2 adds config blocks to the `eslint.config.mjs` T1 creates. Strictly ordered. Clean. |
| T1 → T3 | T3's CI step runs the `format:check` script T1 adds. Ordered. Clean. |
| T2 → T3 | T3 documents T1+T2's outcome. Clean. |
| T1 self-consistency | Step 3 says `.mjs` because package.json has no `"type": "module"` — verified: `require('./package.json').type` is undefined, so a `.js` flat config would be parsed as CJS. Correct. |
| T1 self-consistency | Step 4 fixes the `format` glob (`./src/**.{...}` misses nested dirs — single `*`). That is a real pre-existing bug, not churn. |
| T1 vs constraints | Step 2 moves `prettier` from dependencies to devDependencies but forbids a version change. Consistent with the owner's #76 deferral. |
| T2 self-consistency | Step 5 requires proving two rules can fail. Matches this project's standard; five tests here have been found asserting nothing. |
| Plan vs Global Constraints | No task touches `src/data.csv`, `expected.json`, or coverage thresholds. Source edits are permitted but gated on the L2 replay. Clean. |

## Rulings

- Ruling: target ESLint **9.39.5, not 10.10.0** — why: `eslint-plugin-react`
  peers at `^9.7` and `jsx-a11y` at `^9`, so ESLint 10 would drop React and
  accessibility linting entirely — cost if wrong: another upgrade later when
  those plugins ship v10 support.
- Ruling: Prettier stays at **2.2.1** — why: the owner explicitly deferred it
  (#76); upgrading reformats every file, which is a separate decision. Removing
  `eslint-plugin-prettier` here is what makes that decision independent — cost
  if wrong: nothing; #76 can proceed whenever.
- Ruling: the three `flowtype` rules are dropped and **not** replaced — why:
  this project has no Flow; they were dead weight inherited from
  `eslint-config-react-app` — cost if wrong: none.
- Ruling: `eslint-plugin-react-hooks` enables only `rules-of-hooks` and
  `exhaustive-deps` — why: matches today's two active rules; v7 bundles React
  Compiler rules that would be noise on a React 19 app not using the compiler —
  cost if wrong: compiler lint deferred, which is not in scope for #63.
- Ruling: parity is **measured, not asserted** — T1 captures
  `eslint --print-config` before the change and diffs which rules are active
  after. Same discipline as the golden master. Cost if wrong: a silently
  narrowed lint surface, which is exactly what #63 exists to fix.

## Baseline (captured 2026-09-06, before any change)

116 active rules on `src/db.ts`: core 68, jsx-a11y 17, react 14,
@typescript-eslint 7, import 4, flowtype 3, react-hooks 2, prettier 1.
Zero `jest/*` and zero `testing-library/*` on `src/formulas.test.ts`.
