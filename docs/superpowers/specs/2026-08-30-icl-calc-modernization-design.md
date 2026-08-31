# ICL Calculator — toolchain modernization: design

**Date:** 30 August 2026
**Status:** approved, not yet implemented
**Companion:** `docs/modernization-findings.md` (the survey this design answers)

---

## 1. What this is

A design for moving `icl-calc` off a retired Create React App toolchain without
changing a single number the calculator produces.

This is a clinical tool used for surgical planning. A silently changed numerical
result is the worst possible outcome — worse than the migration failing loudly.
Every decision below is ordered around that one property.

The survey in `docs/modernization-findings.md` established *what* needs to
change. This document establishes *how*, in what order, and what must be true
before each step is allowed to proceed.

---

## 2. The core idea

The February 2022 build still deployed at <https://ruipinge.github.io/icl-calc/>
is correct. It is therefore an **independent oracle**: a reference implementation
that was not produced by the toolchain we are about to replace.

The migration is verified by capturing that oracle's outputs once, freezing them,
and requiring every subsequent step to reproduce them exactly.

Everything else in this document is scaffolding around that sentence.

---

## 3. The oracle

### 3.1 What it is

`gh-pages` @ **`789ac2de9b5886878763a8c06f1a4f71db173270`**, frozen in a detached
worktree at `../icl-calc-oracle`.

Established during design:

- `gh-pages` HEAD is **not** a deploy commit. It is a manual commit of
  2026-07-08 ("Meeting notes") which added exactly one file,
  `2026-07-08/index.html`, and modified no application file.
- The last actual deploy is `dc98e3a` (2021-12-02), publishing master `2436da4`.
- Therefore the application at `789ac2d` is byte-identical to the last deployed
  build, and is a valid oracle.

### 3.2 Why it is frozen locally

`.github/workflows/main.yml` is `on: push`, with the deploy job gated only on
`github.ref == 'refs/heads/master'` and the test job passing. Any successful
push to master — including a docs-only commit — would rebuild and republish.
A rebuild in 2026 resolves the `^` dependency ranges to different versions, so
the artifact would not be the 2022 build. The oracle would be destroyed
silently.

CI is currently broken (master `151dad4`, pushed 29 Aug 2026, produced no deploy
commit), so the immediate risk is low. The local freeze removes it entirely and
makes the oracle re-capturable after the migration ships.

### 3.3 Retirement

The oracle worktree is retired **only** after Phase 5, once the L2 suite has been
replayed against the newly deployed live URL and passes.

---

## 4. The golden master

### 4.1 Two layers

Captured once from the oracle, replayed at two levels:

- **L1 — unit.** Table-driven test over the pure functions (`formulas`, `db`,
  `matrix/data`, `regression/formulas`). Runs in milliseconds on every PR. This
  is the bisect loop.
- **L2 — end-to-end.** Playwright drives a real build of the branch and asserts
  the same values through the rendered DOM. Catches build-layer breakage that L1
  structurally cannot: the `raw.macro` → `?raw` CSV swap, BOM handling, env
  variable renames, `BASE_URL`, routing.

Expectations come from the **deployed artifact**, never from the source under
test. A unit-only golden master would verify the code against itself.

### 4.2 Files

```
tests/golden/inputs.json      hand-authored, reviewed, 10 rows
tests/golden/expected.json    machine-captured from the oracle — IMMUTABLE
tests/golden/capture.spec.ts  Playwright: oracle -> expected.json (run once)
tests/golden/replay.spec.ts   Playwright L2: built branch must equal expected
tests/golden/replay.test.ts   Unit L1: pure functions must equal expected
```

`expected.json` is generated once and then never regenerated. CI fails any pull
request whose diff touches it unless the branch name begins with `oracle/`.
See the stop rule (§7.3).

### 4.3 The clock

`PatientInfo.age()` reads `Date.now()`. `age` feeds the regression coefficients
(`-4.82 * age`, `0.028 * age`) and the Age gauge, so identical inputs produce
different outputs on different days.

All captures and replays pin the clock to **`2026-08-30T12:00:00Z`** —
Playwright via `page.clock.install()` before navigation, unit tests via
`vi.setSystemTime()`. Every fixture row records both the `dateOfBirth` entered
and the `age` it must resolve to, so a clock-pinning failure surfaces as an
explicit mismatch rather than silent drift. All dates of birth are mid-March so
the birthday has already passed on 30 August; the ages stay correct even if the
pinned instant moves by weeks.

### 4.4 Capture surface

| Tab | Captured | Why |
|---|---|---|
| Patient | ICL Sphere, Cylindre, Axis, SE; any validation text | headline clinical numbers; `calcRadiusPosterior` and `calcICLAxis` branches |
| Matrix | every table cell plus the footer AtA/CLR/eye-count line | ~90 values derived from all 542 CSV rows — the CSV canary |
| Regression | vault prediction, cornea-to-endothelium, probability × 3 lens sizes | 9 values, clock-sensitive |
| Normality | gauge pointer offsets and zone boundaries | `quantile()` / `buildZones()` over CSV-derived arrays |

The amCharts histogram is **excluded from L2**: it renders to `<canvas>`, is not
text-diffable, and is replaced in Phase 4b. Instead the data behind it —
`HISTOGRAM_DATA`, 6 series × 10 bins straight from `data.csv` — is locked at L1.
The chart library may change; the numbers it draws may not.

### 4.5 Known hazards recorded, not fixed

- `quantile()` sorts its input array **in place**, mutating the shared
  `VALUES.*` arrays. Harmless today only because `HISTOGRAM_DATA` is computed at
  module load before any sort occurs. Revisit if load order changes.
- `Gauge.tsx` reads Bootstrap CSS custom properties via
  `getComputedStyle(document.body)` at module scope. Returns empty strings under
  jsdom, and will need attention whenever Bootstrap is removed.

---

## 5. Fixture rows

Ten rows, chosen to exercise code branches rather than to look clinical.
Rows 01/02 and 05/06 are **differential pairs** — one variable apart — so a
moved number identifies its own cause. Row 09's CLR of −100 is expected to match
zero eyes in the Matrix table; that is deliberate, and locks the empty-cell
rendering path. Rows 09 and 10 are schema boundaries, not clinical values: they
exist to pin that `Yup` accepts them and the arithmetic yields neither `NaN` nor
`Infinity`.

| # | Row | Age / DOB | AtA | WtW | CLR | ACD | ACAn/t | KAntFlt@ | KAntStp@ | KPost F/S | CCT | Surgery | Sph | Cyl | Axis | Vtx |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | baseline | 30 · 1996-03-15 | 11.80 | 11.90 | 250 | 3.20 | 38/39 | 43.00@180 | 44.00@90 | – | 540 | None | −6.00 | −1.00 | 180 | 12 |
| 02 | posterior K | 30 · 1996-03-15 | 11.80 | 11.90 | 250 | 3.20 | 38/39 | 43.00@180 | 44.00@90 | 6.10@180 / 6.30@90 | 540 | None | −6.00 | −1.00 | 180 | 12 |
| 03 | prior myopia Rx | 45 · 1981-03-15 | 12.10 | 12.20 | 180 | 3.35 | 40/41 | 39.50@175 | 40.50@85 | – | 490 | Myopia | −1.50 | −0.50 | 175 | 12 |
| 04 | prior hyperopia Rx | 45 · 1981-03-15 | 12.10 | 12.20 | 180 | 3.35 | 40/41 | 47.00@10 | 48.00@100 | – | 520 | Hyperopia | −2.00 | −0.75 | 10 | 12 |
| 05 | axis hinge, at | 38 · 1988-03-15 | 11.95 | 12.05 | 300 | 3.25 | 37/38 | 43.50@90 | 44.50@180 | – | 545 | None | −8.00 | −2.00 | 90 | 12 |
| 06 | axis hinge, over | 38 · 1988-03-15 | 11.95 | 12.05 | 300 | 3.25 | 37/38 | 43.50@90 | 44.50@180 | – | 545 | None | −8.00 | −2.00 | 91 | 12 |
| 07 | small-lens bin | 22 · 2004-03-15 | 10.90 | 11.00 | 50 | 2.85 | 33/34 | 44.50@170 | 45.75@80 | – | 555 | None | −4.50 | −0.50 | 170 | 12 |
| 08 | large-lens bin | 55 · 1971-03-15 | 12.90 | 13.00 | 700 | 3.60 | 43/44 | 41.50@5 | 42.25@95 | – | 525 | None | −12.00 | −3.00 | 5 | 12 |
| 09 | schema floor | 22 · 2004-03-15 | 10.50 | 10.60 | −100 | 2.70 | 30/31 | 30.00@0 | 30.00@90 | – | 300 | None | −25.00 | −8.00 | 0 | 8 |
| 10 | schema ceiling | 55 · 1971-03-15 | 13.50 | 13.60 | 900 | 6.00 | 45/46 | 55.00@0 | 55.00@90 | – | 700 | None | 0 | 0 | 180 | 15 |

Branch coverage: `calcRadiusPosterior` fork A (02), fork B (01, 05–10), fork C
(03, 04); `calcICLAxis` at and over the 90° hinge (05, 06); Matrix small and
large lens bins (07, 08) and the empty-cell path (09); schema extremes (09, 10).

Posterior K is entered as **positive** values (~6.1–6.3 D), matching what
`calcRadiusPosterior` expects. See issue #41 — the fields are unvalidated and a
negative entry silently corrupts the result. The fixture captures current
intended behaviour, not an endorsement of the input handling.

---

## 6. Phases

Each phase is one GitHub issue, one worktree, one branch, one pull request into
`modernize`, one squash-merged commit.

| # | Phase | Deliverable | Gate |
|---|---|---|---|
| 0 | Foundations & hygiene | Oracle frozen; `modernize` cut; Node unpinned from 14 to the newest version running the existing suite; stale branches pruned; 16 dependabot PRs closed | `npm ci && npm run lint && npm test` green, **zero app-code changes** |
| 1 | Golden master | `inputs.json`, `capture.spec.ts`, `expected.json`, L1 and L2 replays | L1 **and** L2 green against unmodified HEAD; oracle worktree renders identically to the live URL; manual spot-check of 2 rows |
| 2a | CI rebuild | Workflows on `checkout@v4` / `setup-node@v4`, PR-triggered; `CC_TEST_REPORTER_ID` moved to a secret and rotated; CodeClimate removed; `expected.json` guard | Full pipeline green on a no-op PR; deploy and release jobs provably cannot fire from `modernize` |
| 2b | Vanilla coverage | Codecov removed. Coverage thresholds in test config as a **merge gate**; coverage table to `$GITHUB_STEP_SUMMARY`; PR comment via `actions/github-script` | Coverage floors seeded at current numbers; a deliberate drop fails CI |
| 3a | CRA → Vite | Vite + Vitest, TS 4.1→5. React 17 and router 5 deliberately unchanged. `raw.macro`→`?raw` (BOM verified), `index.html` to root, `REACT_APP_*`→`VITE_*`, `PUBLIC_URL`→`BASE_URL`, `NODE_ENV`→`import.meta.env.PROD`, `transformIgnorePatterns` dropped | `expected.json` unchanged to the digit |
| 3b | React 17 → 19 | `createRoot`; `@testing-library/react` 11→16; all 8 `react-test-renderer` suites rewritten; every `.snap` regenerated | `expected.json` unchanged **while snapshots churn wholesale** |
| 3c | Router 5 → 7 | `Switch`→`Routes`, `element` props, plus a legacy-hash redirect shim | `expected.json` unchanged; a test proving `#matrix` resolves to `#/matrix` |
| 4a | Drop dead services | Remove Sentry, `react-ga`, `GoogleAnalytics.ts`, `web-vitals`; fix the `dependencies`/`devDependencies` split | `expected.json` unchanged; zero third-party network requests |
| 4b | Replace amCharts | Hand-rolled SVG histogram over the L1-locked `HISTOGRAM_DATA`; `@amcharts/amcharts4` removed | `expected.json` unchanged |
| 5 | Ship | Final PR `modernize` → master; semantic-release fires; gh-pages republishes | L2 replayed against the **new live URL** post-deploy; oracle retired only then |

Ordering: 0 → 1 are strictly sequential and everything depends on them. 2a → 2b
follow. 3a → 3b → 3c are strictly sequential so each blast radius is isolated.
4a and 4b are mutually independent. 5 is last.

### 6.1 Why 3 is split three ways

`react-test-renderer` is used by 8 test files and is dropped in React 19, so 3b
regenerates every snapshot in the repo. Snapshot churn is exactly where a real
regression hides. Splitting means that when a number moves, it bisects to one
cause in one step — and it makes 3b's gate meaningful: snapshots may change
freely, `expected.json` may not move by a digit.

`hashType="noslash"` does not exist in react-router 6/7. Today's URLs are
`…/#matrix`; after 3c they become `…/#/matrix`, silently breaking any shared or
bookmarked link. Hence the redirect shim and its test.

---

## 7. Process

### 7.1 Worktrees and branches

```
~/dripcil/icl-calc           master — frozen, never checked out onto a phase
~/dripcil/icl-calc-oracle    gh-pages @ 789ac2d — READ-ONLY, retired at Phase 5
~/dripcil/icl-calc-p0 … p5   one per phase (p2a, p3b, … for sub-phases),
                             removed after its PR merges
```

Branches are `modernize/p0-foundations`, `modernize/p1-golden-master`, and so
on, all targeting `modernize`, never `master`.

Nothing lands on master until Phase 5. Because semantic-release and the gh-pages
deploy are both gated on master, this keeps the live tool at 1.7.0 and the
oracle intact for the whole migration, with **no workflow edits required** — the
mechanism that could destroy the reference is simply never triggered.

### 7.2 Pull request flow

1. Work in the phase worktree; conventional commits (semantic-release depends on
   them for the final version bump).
2. Open a PR into `modernize` with `Closes #n`.
3. CI runs the gates. L1 or L2 red blocks the merge.
4. `/code-review` on the branch, findings posted as inline comments and
   addressed.
5. PR body carries the gate evidence: L1/L2 output, and for 3b the snapshot
   churn count alongside the unchanged-`expected.json` confirmation.
6. Manual review, then **squash merge** — one commit per phase, so a regression
   bisects to a phase in one step.
7. The final `modernize` → master PR is a **merge commit**, so semantic-release
   sees all phase commits and computes the release itself.

### 7.3 The stop rule

> **If a value in `expected.json` moves, work stops.** No fixing forward, no
> regenerating the fixture, no assuming it is rounding.

Procedure: bisect within the phase to the exact commit; record which rows and
fields moved and by how much; then classify.

- **Regression** — revert, re-approach.
- **Deliberate correction** — requires a separate `oracle/` branch, a written
  justification per changed value, and explicit sign-off before `expected.json`
  is touched.

CI enforces the branch-name condition mechanically, so the fixture cannot drift
by accident.

### 7.4 Definition of done, per phase

Gates green · `expected.json` byte-identical (except on an approved `oracle/`
branch) · `/code-review` findings addressed or dismissed with reasons · manual
review · squash-merged · worktree removed · issue closed.

---

## 8. Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Golden master fidelity | Two layers, E2E-captured and unit-replayed | Expectations must come from the deployed artifact, not the source under test |
| Fixture breadth | 10 branch-driven rows | Marginal cost per row is near zero; 3 rows cannot reach the posterior-cornea forks, the axis hinge, or most Matrix bins |
| Branching | Long-lived `modernize`, one PR per phase | Keeps master — and therefore the live tool and the oracle — untouched with no workflow edits |
| Gates | Full CI pipeline, all merge-blocking, plus `/code-review` | Manual review should be judgement, not checking |
| CodeClimate | Dropped | `paambaati/codeclimate-action@v2.7.5` is long dead; its reporter ID was committed in plaintext in a public repo |
| Codecov | Dropped in favour of vanilla | Still free for public repos, but: a coverage credential has already leaked here; it needs a token in a repo minimising third-party surface; and its 2021 uploader compromise is a supply-chain precedent for a clinical tool. Thresholds as a merge gate are strictly stronger than a posted comment. Cost: loss of the trend graph and badge |
| Invalid-input fixture row | Not added | Judged noise |
| Bootstrap 4 / Treeye design system | Out of scope | One concern at a time; toolchain must be stable and verified first |
| Posterior-K bug | Issue #41, after Phase 5 | Pre-existing, not a migration regression; fixing it needs clinical input on sign convention |
| Sentry error backlog | Issue #42 | See §10 — the reading is time-limited even though the fixing is not |

### 8.1 Branches deleted during design

All confirmed to carry no unmerged value; two-dot diffs against current master
showed their content already present under different SHAs, most of the apparent
delta being the branches lagging behind master.

`2del d40eb65` · `chore/lib-upgrades 304dca2` (PR #22 closed) ·
`feat/normality 1e1e963` · `feat/recoil bb4e7ba` · `fix/axis-keratometry b536c10` ·
`fix/google-analytics-track 61d9988` · `fix/matrix-number-display 6cc4e1f`

`feat/recoil` was the only branch with genuinely unmerged code — `src/state/index.js`,
92 lines, a February 2021 Recoil spike against the pre-TypeScript codebase,
superseded by Formik. Its **remote** tip (`63bbadc`) differs from the local tip
and was deliberately left in place pending a separate decision.

---

## 9. Hard constraints

- All computation stays client-side. No patient measurement leaves the browser.
- No new runtime dependency that phones home. The target must survive
  `Content-Security-Policy: default-src 'self'`.
- `src/data.csv` is not to be modified, reformatted, regenerated or moved.
- The repo stays public and MIT.
- The GitHub Pages deployment target and configuration are not to be changed.

---

## 10. Open items

- **The `2026-07-08/index.html` page on `gh-pages`.** Served publicly at
  `https://ruipinge.github.io/icl-calc/2026-07-08/`. `peaceiris/actions-gh-pages`
  replaces branch contents on deploy unless `keep_files: true` is set, so the
  first successful Phase 5 deploy **deletes it** and breaks any shared link.
  Decide before Phase 5: preserve, relocate, or discard.
- **`feat/recoil` remote branch** (`63bbadc`) — delete or keep.
- **116 open Dependabot vulnerability alerts** on master (11 critical, 57 high).
  Not separately actionable; Phase 3 replaces the dependency tree wholesale.
  Re-check the count after Phase 4b.
- **Sentry backlog is perishable.** Free-tier retention is 90 days. Issue #42
  is scheduled after the migration, but the *reading* of the data should happen
  before Phase 4a removes the integration, or it is lost.
- **Node version target for Phase 0, resolved empirically: Node 16
  (`.nvmrc` pins `v16`).** Tested the ladder 22 → 20 → 18 → 16 against the
  existing (untouched) suite:
  - **Node 22, 20, 18 all install, lint, and test cleanly, but `npm run
    build` fails identically on all three** with
    `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/tokenize'
    is not defined by "exports" in
    node_modules/postcss-safe-parser/node_modules/postcss/package.json`.
    The pinned `postcss@8.2.8` nested under `postcss-safe-parser` declares
    an `exports` map with **two** entries: `"."` (the normal entry point)
    and a legacy **trailing-slash folder mapping**, `"./": "./"`, which is
    what used to expose the whole package tree — including
    `postcss/lib/tokenize` — to deep `require()`s from other packages, such
    as the one webpack 4's CSS-minification chain (via
    `postcss-safe-parser`) makes. Node 16 actually printed a deprecation
    warning for this on every build in this task
    (`[DEP0148] DeprecationWarning: Use of deprecated folder mapping "./" in
    the "exports" field module resolution of the package at
    .../postcss-safe-parser/node_modules/postcss/package.json. Update this
    package.json to use a subpath pattern like "./*".`) but still honored
    it. **Node removed support for trailing-slash folder mappings in
    `exports` around Node 17**, turning what was a warning into the hard
    `ERR_PACKAGE_PATH_NOT_EXPORTED` failure seen on 18/20/22 — the map isn't
    missing the subpath, it grants it through a mapping form Node stopped
    honoring.
    This is **not** the anticipated `ERR_OSSL_EVP_UNSUPPORTED` md4/OpenSSL-3
    failure — `NODE_OPTIONS=--openssl-legacy-provider` was tried on Node 22
    and does not help, since this error is thrown before webpack's hashing
    code path is ever reached. **Node 22/20/18 are rejected on this basis.**
  - **Node 16.20.2 passes install, lint, test, and build cleanly, with no
    flags needed** (Node 16 predates the OpenSSL-3 default, so the
    anticipated md4 issue never arises either).
  - **Implication for Phase 3a:** the two failure modes are independent and
    do not both require the webpack 4 removal to fix. The OpenSSL/md4 issue
    goes away when webpack 4 goes. The `exports` issue is specific to this
    exact pinned `postcss@8.2.8` (nested under `postcss-safe-parser`) and
    its legacy folder mapping — **upgrading or replacing
    `postcss-safe-parser`/`postcss` to a version with a conventional
    `exports` map (using `"./*"` subpath patterns, as Node's own
    deprecation message suggests) is a candidate fix on its own**, and may
    unblock a newer Node before or independent of the webpack 4 replacement.
    Re-run this ladder after either change and expect a newer Node to
    become viable.
  - **Separate finding, orthogonal to the Node version:** this project's
    `package-lock.json` (`lockfileVersion: 2`) contains only the legacy
    `dependencies` tree and is missing the `packages` object that modern npm
    (7–10, confirmed on npm 8.19.4 / 10.7.0 / 10.8.2 / 10.9.8, i.e. across
    every rung of the ladder) uses to know which packages declare a `bin`.
    As a result `npm ci` extracts every package correctly but **silently
    creates no `node_modules/.bin` symlinks at all**, for any package, on
    any Node version tested — `eslint`, `react-scripts`, `jest`, `prettier`
    etc. are all present on disk but unreachable via `npm run <script>`.
    `npm rebuild` does not fix it either. Root-caused by reading
    `@npmcli/arborist`'s `Builder#addToBuildSet` (in `rebuild.js`): it only
    queues a node for bin-linking when `node.package.bin` is truthy, and
    that field is populated from the lockfile's tree data during `npm ci`,
    which this lockfile never supplies. Worked around locally (for this task
    only, to actually exercise lint/test/build) by manually symlinking each
    installed package's declared `bin` entries into `node_modules/.bin` — a
    purely local, gitignored, reversible fix that touches no tracked file.
    This will keep recurring for anyone running a plain `npm ci` until a
    future phase regenerates the lockfile with a modern `npm install` (out
    of scope here — the Step 2 gate requires the lockfile stay byte-for-byte
    unchanged in this task).
- **Written confirmation that the row-level dataset may be published publicly**
  remains outstanding. Blocks nothing here; tracked in the Treeye roadmap.
