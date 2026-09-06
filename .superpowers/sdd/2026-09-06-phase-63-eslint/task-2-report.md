# Task 2 report: test-file lint coverage restored (the actual #63)

## Status

Complete. All four gates green, L2 golden-master replay reproduces the
December 2021 oracle exactly, 174 tests pass with 0 skipped, and coverage is
unchanged from baseline (91.51% branch, matching the enforced floor exactly).
Zero rules were blanket-disabled.

## Commit

`1f43e4a` (branch `modernize-p63-eslint`, parent `f0493fb` — Task 1's
commit).

## Four gate exit codes (Step 6)

| gate | exit code |
| --- | --- |
| `npm run lint` | 0 |
| `npm run format:check` | 0 |
| `npx tsc --noEmit` | 0 |
| `npm test` | 0 (174 passed, 0 skipped, 24 test files) |

Each checked with a standalone `echo $?`, never through a pipe, and each
re-verified a second time after the Step 5 red/green proof touched files
again, to rule out the proof leaving anything behind.

## L2 replay result

```
npm run build                                     -> exit 0
cd e2e && npm ci --prefer-offline (Node v20.14.0)  -> exit 0
./setup.sh --subject-only                          -> exit 0
SUBJECT_ONLY=1 npm run replay                      -> exit 0

  ✓ 1 [replay] › the fixture inputs match what the oracle was captured from
  ✓ 2 [replay] › the build under test reproduces the oracle exactly
  2 passed (6.2s)
```

This matters here specifically because two source files were touched (see
"Source edits" below) to satisfy `testing-library` rules — the replay is the
proof those edits are non-semantic.

## Lint findings: how many, across how many files

Initial `npm run lint` after wiring the two plugins: **21 errors across 5
test files** — `App.test.tsx` (1), `ICLContainer.test.tsx` (5),
`normality/Histogram.test.tsx` (12), `patient/CorneaProfile.test.tsx` (2),
`patient/Info.test.tsx` (1). Zero warnings.

**This is real, not under-configured — but it is fewer files than the brief's
"roughly twenty" estimate.** 17 of the repo's 21 test files import
`@testing-library/react` at all (the rest — `formulas.test.ts`, `db.test.ts`,
`types.test.ts`, `util.test.ts`, `matrix/data.test.ts`,
`regression/formulas.test.ts`, `golden/*` — are pure unit tests with no DOM
rendering, so `testing-library/*` rules structurally cannot apply to them).
Of those 17, only 5 had a violation; the other 12 already queried and awaited
correctly. Verified this wasn't a scoping bug (rules silently not attached to
most files) directly: Step 5 below proves the rules do fire on files that are
already clean, by injecting a violation and watching it go red.

## jest → vitest rule mapping

The old `react-app/jest` (`eslint-config-react-app`'s jest layer) rule set,
mapped deliberately as the brief asked:

| jest rule | vitest equivalent | disposition |
| --- | --- | --- |
| `no-conditional-expect` | `vitest/no-conditional-expect` | direct |
| `no-identical-title` | `vitest/no-identical-title` | direct |
| `no-interpolation-in-snapshots` | `vitest/no-interpolation-in-snapshots` | direct |
| `no-mocks-import` | `vitest/no-mocks-import` | direct |
| `valid-describe` | `vitest/valid-describe-callback` | renamed equivalent |
| `valid-expect` | `vitest/valid-expect` | direct |
| `valid-expect-in-promise` | `vitest/valid-expect-in-promise` | direct |
| `valid-title` | `vitest/valid-title` | direct |
| `no-jasmine-globals` | **none — dropped** | Jest-specific: guards against Jasmine-compat globals from Jest's Jasmine layer. Vitest has no Jasmine compatibility layer, so the condition cannot occur |
| `no-jest-import` | **none — dropped** | Jest-specific: bans importing the `jest` global. Under Vitest, `import { vi } from 'vitest'` is the normal, encouraged way to reach the mocking API — an inverse rule would be actively wrong here |

Rather than hand-picking only the 8 mapped rules, `eslint.config.mjs` spreads
`@vitest/eslint-plugin`'s full `recommended` config, which is a superset. The
extra rules it adds beyond the old jest set are exactly the kind of thing
this task is for — most notably `vitest/expect-expect` ("test has no
assertions"), which is what caught the App.test.tsx finding below.

`eslint-plugin-testing-library`'s `flat/react` preset (runner-agnostic, no
jest/vitest translation needed) is spread in full alongside it, with
`no-dom-import` configured `['error', 'react']` exactly as the preset ships
it and as the brief specified.

## Rules disabled

**None.** Every rule from both plugins' recommended/preset configs stayed
enabled at its default severity; every violation was fixed at the source
(test file or, in two cases, the component under test — see below), not
suppressed. `eslint.config.mjs` carries no new disable comment.

## THE FINDING: a sixth test asserting nothing

The brief noted this project has already found **five** tests that passed
their suites for years while checking nothing (three `asserting-nothing`
snapshot cases plus two related coverage gaps, catalogued across Phases 2a
and 3b in `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
lines ~935–1042). `vitest/expect-expect` found what appears to be a **sixth**,
previously unrecorded, in `src/App.test.tsx`:

```ts
it('renders without crashing', () => {
  render(<App />);
});
```

Zero assertions. `render()` throwing would fail the test, so it was not
*completely* inert — but a component that mounted and rendered blank, or
landed on the wrong tab, or rendered the wrong form entirely, would still
pass it. This is the same failure shape as the previously-found five: a test
that can never go red for the thing its name claims to check.

**Fixed, not just silenced:** the test now asserts that the Patient tab (the
default `#` route) actually rendered its form:

```ts
expect(screen.getByLabelText('Name')).toBeInTheDocument();
```

This is a real, if narrow, strengthening — `App.tsx` is the one component
none of the other suites render (everything else goes through
`ICLContainer` directly), so this was the only test standing between "App
mounts" and "App actually shows the calculator."

## Other real findings fixed (not just lint-silenced)

- **`src/ICLContainer.test.tsx`, 5 instances of
  `testing-library/no-wait-for-side-effects`.** Every one was
  `await waitFor(() => { fireEvent.click(...) / fireEvent.change(...) })` —
  firing a DOM event inside `waitFor`'s retry callback, which is meant to
  *poll an assertion*, not execute a side effect (a side effect that
  re-fires on every retry is the anti-pattern the rule exists to catch,
  though in this file the callback always succeeded on the first try, so it
  never actually double-fired — this was stylistic drift, not a live bug).
  Fixed by moving each `fireEvent` out to a plain synchronous call and
  wrapping only the following assertion in `waitFor`.

  **This fix had a side effect worth recording in itself:** the naive
  version (drop `waitFor` entirely, call `fireEvent` synchronously, assert
  immediately) passed all 174 tests but silently collapsed branch coverage
  in `src/patient/{Biometry,CorneaProfile,Refraction,Info}.tsx` from ~91.5%
  to as low as 10% on some files. Root cause: this app's `validationSchema`
  is one Yup schema shared across the whole Patient form, and Formik's
  `validateForm()` resolves asynchronously (via a Promise chain) even for a
  synchronous schema. The original `await waitFor(...)` gave that promise
  chain a tick to settle before the next assertion ran; calling `fireEvent`
  with no `await` anywhere removed that tick, so the error-display branches
  in those four components' JSX (`error/touched` conditionals) stopped being
  exercised — not because the assertions were wrong, but because validation
  hadn't resolved yet when the DOM was inspected. Fixed by keeping the
  `waitFor`, moved to wrap only the assertion after each `fireEvent`, which
  satisfies the lint rule and restores the tick. Coverage is back to
  exactly 91.51% branch (the enforced floor) — confirmed by running the full
  suite with coverage twice more after the fix.

- **`src/normality/Histogram.test.tsx`, 12 instances of
  `no-container`/`no-node-access`.** Tests reached into the DOM via
  `container.querySelector(...)` for the chart's SVG, gridlines and bars to
  read exact `x`/`width` attributes for a pixel-alignment check (see the
  file's own comment on why: the histogram and the gauge beneath it share a
  fixed-pixel horizontal scale, and that alignment broke once already,
  silently, before this project's history). Fixed by using existing
  (`data-testid="histogram"`, `data-testid="bar"`) and one new
  (`data-testid="gridline"`, added to `Histogram.tsx`) test ids with
  `screen.getByTestId`/`getAllByTestId`, instead of raw DOM traversal.

- **`src/patient/CorneaProfile.test.tsx`, 2 instances of
  `no-container`/`no-node-access`.** The test's own comment already
  documented why: the `<label>` for the "Previous Corneal Refractive
  Surgery" select had no matching `id`, so `getByLabelText` couldn't resolve
  it, forcing a `container.querySelector('select[name=...]')` workaround.
  Rather than keep working around a real accessibility bug, fixed the bug:
  added `id="corneaProfile.previousSurgery"` to the `Field` in
  `CorneaProfile.tsx`, which makes the label-to-control association work as
  intended and lets the test use `screen.getByLabelText(...)` directly. This
  is the one other production-file edit — see below.

- **`src/patient/Info.test.tsx`, 1 instance of
  `testing-library/prefer-screen-queries`.** Destructured `getByLabelText`
  off the `render()` result instead of using `screen.getByLabelText`.
  Mechanical fix, no behavioural question.

## Source edits: provably non-semantic

Two production files changed, both purely additive DOM attributes with no
effect on rendered visuals, computed values, or any selector this app or its
e2e suite reads by:

- `src/normality/Histogram.tsx` — added `data-testid="gridline"` to the
  y-axis `<line>` elements.
- `src/patient/CorneaProfile.tsx` — added `id="corneaProfile.previousSurgery"`
  to the `previousSurgery` `<Field as="select">`.

Verified non-semantic two ways: (1) the L2 replay above still reproduces the
December 2021 oracle exactly, and (2) `git diff` on the three affected
snapshot files (`ICLContainer.test.tsx.snap`, `normality/index.test.tsx.snap`,
`patient/CorneaProfile.test.tsx.snap`) shows **57 lines changed, all 57
insertions, 0 deletions** — every changed line is exactly one of the two new
attributes, confirmed with
`git diff -- 'src/**/*.snap' | grep -E '^[+-]' | sort | uniq -c`. Nothing else
in any snapshot moved. Updated via `npx vitest run -u`, then re-verified with
a plain `npm test` run.

## Step 5: proving the rules are live

Picked one `vitest/*` and one `testing-library/*` rule, injected a real
violation, confirmed red, reverted, confirmed green, on both.

**`vitest/expect-expect`** — in `src/App.test.tsx`, temporarily removed the
`expect(...)` line added above:
```
$ npx eslint src/App.test.tsx
  4:1  error  Test has no assertions  vitest/expect-expect
✖ 2 problems (1 error, 1 warning)
EXIT:1
```
Restored the assertion:
```
$ npx eslint src/App.test.tsx
EXIT:0
```

**`testing-library/prefer-screen-queries`** — in `src/patient/Info.test.tsx`,
temporarily destructured `getByLabelText` off `render()`'s result again (the
exact pattern this task had just fixed) and used it instead of `screen`:
```
$ npx eslint src/patient/Info.test.tsx
  34:10  error  Avoid destructuring queries from `render` result, use `screen.getByLabelText` instead  testing-library/prefer-screen-queries
✖ 2 problems (1 error, 1 warning)
EXIT:1
```
Reverted to `screen.getByLabelText`:
```
$ npx eslint src/patient/Info.test.tsx
EXIT:0
```

`git diff --stat` on both files after the proof matches exactly the intended
final state (no leftover temp code), confirmed directly.

## Files touched

- `eslint.config.mjs` — added `eslint-plugin-testing-library` and
  `@vitest/eslint-plugin`, wired to a new config block scoped to
  `src/**/*.{test,spec}.{ts,tsx}`.
- `package.json` / `package-lock.json` — `eslint-plugin-testing-library`
  `^3.9.2` → `^7.16.2`; `@vitest/eslint-plugin` `^1.6.27` added.
- `src/App.test.tsx`, `src/ICLContainer.test.tsx`,
  `src/normality/Histogram.test.tsx`, `src/patient/CorneaProfile.test.tsx`,
  `src/patient/Info.test.tsx` — the 21 lint fixes above.
- `src/normality/Histogram.tsx`, `src/patient/CorneaProfile.tsx` — the two
  additive, non-semantic attribute additions above.
- `src/__snapshots__/ICLContainer.test.tsx.snap`,
  `src/normality/__snapshots__/index.test.tsx.snap`,
  `src/patient/__snapshots__/CorneaProfile.test.tsx.snap` — regenerated,
  additive-only, to match the two attribute additions.
- `src/data.csv` and `src/golden/expected.json` — untouched, confirmed via
  `git status --porcelain` before commit.
