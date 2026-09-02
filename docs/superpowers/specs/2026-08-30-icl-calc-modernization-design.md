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

The December 2021 build still deployed at <https://ruipinge.github.io/icl-calc/>
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
src/golden/inputs.json        hand-authored, reviewed, 10 rows
src/golden/expected.json      machine-captured from the oracle — IMMUTABLE
src/golden/replay.test.ts     Unit L1: pure functions must equal expected
e2e/capture.spec.ts           Playwright: oracle -> expected.json (run once)
e2e/replay.spec.ts            Playwright L2: built branch must equal expected
```

The fixtures and the L1 test live under `src/`, not `tests/`: `tsconfig.json`
has `include: ["src"]`, and CRA's Jest only discovers tests under `src/` — a
file outside it is simply invisible to `npm test`. The Playwright specs live
in `e2e/`, deliberately outside `src/` so Jest does not try to collect them.

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

**Fixture-authoring rule:** `page.clock.install()` ticks forward from the
pinned origin in real time as the capture/replay runs, it does not stay frozen
at the exact instant it was installed at. A fixture row's `dateOfBirth` must
therefore not fall within a day of the pinned clock, or a birthday crossing
mid-run makes the capture nondeterministic - `age` (and everything derived
from it) could differ depending on exactly how long the run took. This is
currently safe only by accident: every row's `dateOfBirth` is 15 March against
a clock pinned to 30 August, comfortably clear of the boundary. Any new row
must keep the same clearance.

### 4.4 Capture surface

| Tab | Captured | Why |
|---|---|---|
| Patient | ICL Sphere, Cylindre, Axis, SE; any validation text | headline clinical numbers; `calcRadiusPosterior` and `calcICLAxis` branches |
| Matrix | every table cell plus the footer AtA/CLR/eye-count line | ~90 values derived from all 542 CSV rows — the CSV canary |
| Regression | vault prediction, cornea-to-endothelium, probability × 3 lens sizes | 9 values, clock-sensitive |
| Normality | gauge pointer offsets and zone boundaries | `quantile()` / `buildZones()` over CSV-derived arrays |

The amCharts histogram is **excluded from L2**: it is not text-diffable in any
useful way, and is replaced in Phase 4b. Instead the data behind it —
`HISTOGRAM_DATA`, 6 series × 10 bins straight from `data.csv` — is locked at L1.
The chart library may change; the numbers it draws may not.

amCharts 4 renders to inline **`<svg>`**, not `<canvas>` as previously assumed
here. That detail matters for the gauge pointers captured on the same tab: a
naive selector for "the gauge's SVG" would also match the histogram's SVG, so
the gauge-pointer locator is scoped to the gauge container's inline
`margin-left` style rather than to the SVG element itself.

A gauge pointer is **absent from the DOM entirely**, not merely hidden, when
its value falls outside the zone's `[min, max]` range —
`LinearGauge.renderPointer` only emits the pointer element when
`min <= value <= max`. So a captured pointer value of `null` is a legitimate,
expected reading for a row whose value is off the gauge, not a sign the
capture broke.

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

Row 02's posterior-K values are **7.0/7.4 D**, not the 6.1/6.3 D originally
drafted: 6.1/6.3 is a *normal* posterior cornea, exactly what fork B's 0.84
ratio reproduces from the anterior K — so the originally drafted pair captured
byte-identical output for rows 01 and 02 and fork A went completely
unprotected. 7.0/7.4 D is a steep, ectatic posterior cornea, the clinical case
where measuring posterior K actually changes the result; the pair now differs
on three of its four ICL Power outputs.

Rows 07 and 08's AtA/WtW/CLR were re-centred from their original draft values,
which matched **zero** eyes in `data.csv` and so exercised nothing in the
Matrix table. The new centres were chosen from the actual density of
`data.csv`: row 07 (ata 11.9, wtw 12.0, clr 100) matches 39 eyes and fills the
12.6 mm lens columns; row 08 (ata 12.7, wtw 12.8, clr 200) matches 28 eyes and
fills the 13.7 mm lens columns.

| # | Row | Age / DOB | AtA | WtW | CLR | ACD | ACAn/t | KAntFlt@ | KAntStp@ | KPost F/S | CCT | Surgery | Sph | Cyl | Axis | Vtx |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | baseline | 30 · 1996-03-15 | 11.80 | 11.90 | 250 | 3.20 | 38/39 | 43.00@180 | 44.00@90 | – | 540 | None | −6.00 | −1.00 | 180 | 12 |
| 02 | posterior K | 30 · 1996-03-15 | 11.80 | 11.90 | 250 | 3.20 | 38/39 | 43.00@180 | 44.00@90 | 7.00@180 / 7.40@90 | 540 | None | −6.00 | −1.00 | 180 | 12 |
| 03 | prior myopia Rx | 45 · 1981-03-15 | 12.10 | 12.20 | 180 | 3.35 | 40/41 | 39.50@175 | 40.50@85 | – | 490 | Myopia | −1.50 | −0.50 | 175 | 12 |
| 04 | prior hyperopia Rx | 45 · 1981-03-15 | 12.10 | 12.20 | 180 | 3.35 | 40/41 | 47.00@10 | 48.00@100 | – | 520 | Hyperopia | −2.00 | −0.75 | 10 | 12 |
| 05 | axis hinge, at | 38 · 1988-03-15 | 11.95 | 12.05 | 300 | 3.25 | 37/38 | 43.50@90 | 44.50@180 | – | 545 | None | −8.00 | −2.00 | 90 | 12 |
| 06 | axis hinge, over | 38 · 1988-03-15 | 11.95 | 12.05 | 300 | 3.25 | 37/38 | 43.50@90 | 44.50@180 | – | 545 | None | −8.00 | −2.00 | 91 | 12 |
| 07 | small-lens bin | 22 · 2004-03-15 | 11.90 | 12.00 | 100 | 2.85 | 33/34 | 44.50@170 | 45.75@80 | – | 555 | None | −4.50 | −0.50 | 170 | 12 |
| 08 | large-lens bin | 55 · 1971-03-15 | 12.70 | 12.80 | 200 | 3.60 | 43/44 | 41.50@5 | 42.25@95 | – | 525 | None | −12.00 | −3.00 | 5 | 12 |
| 09 | schema floor | 22 · 2004-03-15 | 10.50 | 10.60 | −100 | 2.70 | 30/31 | 30.00@0 | 30.00@90 | – | 300 | None | −25.00 | −8.00 | 0 | 8 |
| 10 | schema ceiling | 55 · 1971-03-15 | 13.50 | 13.60 | 900 | 6.00 | 45/46 | 55.00@0 | 55.00@90 | – | 700 | None | 0 | 0 | 180 | 15 |

Branch coverage: `calcRadiusPosterior` fork A (02), fork B (01, 03–10);
`calcICLAxis` at and over the 90° hinge (05, 06); Matrix small and large lens
bins (07, 08) and the empty-cell path (09); schema extremes (09, 10).

**Correction (final review, Phase 1):** rows 03 and 04 were originally
documented as exercising a distinct "fork C" of `calcRadiusPosterior`. Reading
`src/formulas.ts` shows no such fork: the `previousSurgery === none` branch
and the `previousSurgery` Myopia/Hyperopia branch return the byte-identical
expression, so no captured value can tell them apart. Rows 03/04 exercise
fork B's arithmetic while carrying the `previousSurgery` flag, which currently
changes no output - known behaviour, not a defect this fixture asserts
against (see `src/golden/inputs.json`'s `why` fields for 03/04, corrected to
match).

Posterior K is entered as **positive** values (~7.0–7.4 D), matching what
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

### 6.2 Blind spots the golden master does not cover (final review, Phase 1)

**This is no longer a theoretical gap. Phase 3a hit it once — see §10's Phase
3a result for the full account.** `index.html`'s `<meta name="msapplication-config"
content="/browserconfig.xml">` shipped without its `/icl-calc/` base prefix,
because the mechanical `%PUBLIC_URL%/` → `/` substitution used to port
`public/index.html` to the Vite-root `index.html` covers root-absolute
attribute values by pattern, and Vite's own dev/build asset-URL rewriting
only touches attributes it treats as asset references (`link[href]`,
`script[src]`) — `meta[content]` is neither. Both golden-master gates were
green throughout: `readAll()` captures ICL Power, Matrix, Regression and
Normality values, never page `<head>` metadata, exactly as predicted below.
The defect was caught only by the Phase 3a checklist item this section
already called for — a human diffing every built `<head>` tag against the
oracle's — not by CI. Say this plainly: the blind spot is real, it produces
exactly the class of silent failure this document warned about, and the
only thing that closed it was doing the manual check the spec already
mandated. Fixed in `4a64607` before Task 2 was accepted.

Both gates - L1 and L2 - are blind to a class of regression that changes no
computed number:

- **Environment-variable renames.** `REACT_APP_VERSION` (`src/misc/Footer.tsx`),
  `PUBLIC_URL` (`src/misc/NavBar.tsx`) and `NODE_ENV` (`src/index.tsx`,
  `src/misc/GoogleAnalytics.ts`) are read by name, as strings, nowhere near
  `expected.json`'s capture surface (§4.4 captures ICL Power, Matrix,
  Regression and Normality values - never the footer text or nav links). A
  botched rename in Phase 3a (`REACT_APP_*` → `VITE_*`, `PUBLIC_URL` →
  `BASE_URL`, `NODE_ENV` → `import.meta.env.PROD`) ships a literal
  `vundefined` in the footer, or a broken asset base path, with every L1 and
  L2 assertion green.
- **Hash-router URLs.** No test in this repo asserts on `window.location` or
  the URL bar. Phase 3c's `hashType="noslash"` removal (§6.1) changes
  `…/#matrix` to `…/#/matrix`; nothing in the golden master would notice,
  because `fillRow`/`readAll` never read the URL, only form and table
  contents.

Neither is worth a golden-master test on its own - a snapshot of the footer
string or the URL bar would be one more brittle assertion for a narrow class
of bug. They are, instead, **required manual checklist items for the phases
that can cause them**, so that "the golden master is green" is never read as
"3a is safe" or "3c is safe" on its own:

- **Phase 3a checklist:** after the env-var rename, load the built app and
  visually confirm the footer version string and every asset/link built from
  `PUBLIC_URL`/`BASE_URL` render real values, not `undefined` or a broken
  path.
- **Phase 3c checklist:** after the router migration, confirm a bookmarked
  `#matrix`-style URL still resolves to the Matrix tab (the redirect shim's
  own test, §6.1, covers the shim mechanically; this is the manual
  confirmation that a real old-style bookmark still works end to end).

### 6.3 Versioning (recorded Phase 3a, Task 1; version target confirmed by owner)

`semantic-release` runs in the `deploy` job of `.github/workflows/main.yml`,
master-only, gated behind `test`, `e2e-replay` and `!cancelled()` (§6, §7.1).
On a qualifying push it reads the conventional-commit history since the last
release tag, computes the next semver, writes it into `package.json`, commits
that back with `[skip ci]`, and cuts a GitHub release. `package.json` carries
`"private": true`, so nothing is ever published to npm — only the version
bump and the GitHub release happen. The bump is therefore automatic in
mechanism but human-gated in practice: per §7.1 nothing lands on `master`
until Phase 5's single merge, so it fires exactly once, on that merge.

**As things stand, that merge would ship 1.8.0.** The only release-triggering
commit on `modernize` so far is `feat(ci): add the typecheck, fixture-guard
and L2 replay gates` (`0bdc935`, PR #62) — the default semantic-release
analyser bumps `minor` for any `feat` regardless of scope, so CI-only tooling
work queued a minor bump it should not have. That commit is merged and not
worth rewriting history over; from here, tooling commits should use `ci:` or
`chore(ci):` so the version continues to track user-facing change, not build
plumbing.

**Agreed target: 2.0.0, decided deliberately, not provisional.** The owner
has confirmed this. The declaration point is Phase 3c (issue #49), where the
genuine breaking change lives: `hashType="noslash"` does not exist in
react-router 6/7 (§6.1), so hash URLs move from `#matrix` to `#/matrix`. Even
with the redirect shim in place, this breaks every bookmarked or shared deep
link that predates it. But the version target is not decided on that break
alone — it is decided on the shape of the whole programme: build tool
(CRA → Vite), runtime (React 17 → 19), chart library (amCharts → hand-rolled
SVG) and telemetry (Sentry/GA removed) all change across Phases 3–4b. For a
clinical tool, a major version bump is the correct signal for that: it tells
the owner, and anyone auditing a deploy, to re-verify rather than assume
continuity with 1.x behaviour.

**Mechanically, the commit that lands the router migration needs
`BREAKING CHANGE:` in its footer, or `!` after the type** — that is the only
mechanism in this pipeline capable of producing a major bump.

**This must survive squash-merging.** Per §7.2, each phase branch is
squash-merged into `modernize`, and semantic-release reads commit history on
`master` after the final `modernize` → master merge (§7.2 step 7) — the
squash commit message is what it actually sees, not the individual commits
authored on the Phase 3c branch. Writing `BREAKING CHANGE:`/`!` on a commit
partway through the Phase 3c branch and losing it when that branch is
squashed into one `modernize` commit would silently revert the target to
1.8.0. The footer must be present in **the Phase 3c squash commit message
itself** — this is the one place it is easy to write correctly on a branch
and lose at merge time, so it needs a deliberate check during Phase 3c's
squash-merge step, not an assumption that it carried over.

**Phase 5 must verify the computed version before releasing, not after.**
Before merging `modernize` → `master`, run `npx semantic-release --dry-run`
against the merge commit and confirm it reports **2.0.0**. If it reports
1.8.0 instead, the breaking-change declaration was lost somewhere between
Phase 3c and the final merge, and the fix (amend the merge commit's message,
or the relevant squash commit, before the real run) is cheap at that point
and awkward once the real `deploy` job has already cut the tag, written the
GitHub release and republished `gh-pages`.

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

**Correction (final review, Phase 1):** the sentence above overstated what
exists today. There is no CI job that enforces the branch-name condition -
`.github/workflows/main.yml` contains nothing that reads `expected.json` or
checks for an `oracle/` branch prefix. Enforcing it mechanically is Phase 2a's
responsibility (issue #45). Until that lands, the fixture is protected by
convention (this document, the README embedded in `expected.json`, and PR
review) plus the in-suite digest assertions in `src/golden/replay.test.ts` and
`e2e/replay.spec.ts` - and those assertions check that the fixture *inputs*
(`src/golden/inputs.json`'s rows) match what `expected.json` was captured
from, not that `expected.json` itself is unmodified. A hand-edited value in
`expected.json` that still matches the recorded digest would pass every gate
in this repo today.

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
| `CC_TEST_REPORTER_ID` history exposure | Accepted risk, closed — not rotated | Committed in plaintext in the workflow before Phase 2a removed the CodeClimate step (`33a8dc5`); still present in git history (e.g. `b48d6e3`). It cannot be rotated: the owner no longer has CodeClimate access. Accepted because the token's only capability is posting coverage for this repo to a service no longer in use — it grants no source access, no repository write and no other secret. The integration it authenticates to is already deleted. The only way to purge it from history is rewriting history on a public repo, which would invalidate every commit SHA — including `2436da4` and `789ac2d`, the two SHAs the oracle's entire provenance chain depends on (§3.1). Rewriting history to erase a dead credential to a decommissioned service is strictly worse than leaving it. Closed, not outstanding. |

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

- **Phase 1 result, recorded after implementation.** All 10 fixture rows were
  captured from the oracle; the frozen oracle worktree was cross-checked
  byte-for-byte against the live URL (spec §3.1/§4.1) and found identical.
  L1 (`npm test -- --testPathPattern=src/golden`) is 233 scalar comparisons —
  23 per row (5 ICL Power fields, 9 regression-table values, 9 matrix eye
  counts) across 10 rows, plus 3 global assertions (CSV row count, pinned
  clock, inputs digest) — plus a snapshot locking all 180 numbers behind
  `HISTOGRAM_DATA` (6 series × 10 bins × 3 fields: count/from/to). L2
  (`npm --prefix e2e run replay`) replays the full DOM for all 10 rows against
  a real `npm run build` of the branch. Both are green against unmodified
  HEAD. `git diff 2436da4 HEAD -- src/ ':!src/golden'` is empty — the
  application source is byte-identical to the oracle's commit — which is what
  makes the L2 pass mean something: it is a real build of the oracle's own
  code, not a build of code that happens to compute the same numbers by
  coincidence.
  - The phase branches are named with a hyphen (`modernize-p0-foundations`,
    `modernize-p1-golden-master`), not the slash form `modernize/p0-...`
    written earlier in this document: git cannot create a ref under
    `refs/heads/modernize/x` while a branch literally named `modernize`
    already exists (a ref cannot be both a file and a directory in git's
    ref namespace).
  - `e2e/` is an isolated Playwright workspace with its own `package.json`
    and lockfile, pinned to Node 20 (`e2e/.nvmrc`), deliberately separate
    from the app: the app's `package-lock.json` must stay the frozen 2021
    tree, and the app itself only builds on Node 16 (see the Node-ladder
    finding below), so Playwright's own modern dependency needs cannot share
    that tree.
  - Two issues were filed during this work: **#55**, a `CorneaProfile`
    snapshot test that renders against renamed fields and asserts nothing —
    it will fail Phase 2a's own `tsc --noEmit` gate on day one; and **#56**,
    `LinearGauge.dispose()` mutating a live `NodeList` while iterating it.
  - **The manual live-site verification (spec's brief Step 5) is DONE.** A
    human opened <https://ruipinge.github.io/icl-calc/>, entered rows
    `01-baseline` and `08-large-lens-bin` by hand, and confirmed the four ICL
    Power values match `expected.json` for both. (Final review, Phase 1:
    updated from "outstanding" now that this has actually been performed.)
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
- **CI was dead, and is now revived (Phase 2a, part 1).** Phase 0 changed
  `.nvmrc` to `v16` but left `.github/workflows/main.yml` alone. That
  workflow had not executed a single step in a long time: every run failed
  within seconds at "Set up job", because GitHub hard-fails the deprecated
  `actions/cache@v2`. Lint and tests never ran, on any branch. This confirms
  `docs/modernization-findings.md`'s prediction that the workflow does not
  run green today.
  PR #59 revived it as the first slice of Phase 2a (#45): supported actions,
  `setup-node@v4`'s built-in npm cache, dead Codecov and CodeClimate steps
  removed in favour of a coverage summary on the run page, and a
  `pull_request` trigger. The `test` job runs on **Node 20** — lint and tests
  are version-insensitive, verified identical on 16/18/20/22 in Phase 0 —
  while `deploy` still pins **Node 16**, because it builds and the build
  fails on 18+ with `ERR_PACKAGE_PATH_NOT_EXPORTED`. `deploy` remains
  gated on `master`.
  It also required `scripts/link-bins.js`, run after every `npm ci`, to work
  around the lockfile defect above; that script is deleted in Phase 3a (#47)
  once the lockfile is regenerated.
  Two things are still deliberately absent and belong to the rest of #45:
  the `tsc --noEmit` gate (it would fail immediately on #55) and the
  `expected.json` branch-name guard described in §7.3.
  Consequence worth recording: the L1 suite was developed and validated
  locally on Node 16, and now runs in CI on Node 20.
- **Phase 3a result, recorded after implementation (issue #47).** CRA →
  Vite, Jest → Vitest, TypeScript 4.1 → 5, lockfile regenerated from
  scratch. `src/golden/expected.json` and `src/data.csv` are byte-identical
  from the phase's first commit to its last — both still show last-touched
  at `8568202` (Phase 1's capture), never re-diffed by any Phase 3a commit.
  158 tests passed / 3 skipped throughout, on Jest and then on Vitest
  (`vitest@^1.6.1`, held below `2.x` deliberately: Vitest 2+ bundles
  `vite@^5` as a hard dependency, which would have put two Vite majors in
  one tree while this phase's whole point was isolating the build-tool
  variable — not a Node-compatibility constraint, see the `.nvmrc` bullet
  below).
  - **The CSV survived provably, not just by inspection.** `raw.macro`
    (finding 2, `docs/modernization-findings.md`) is gone;
    `src/db.ts` now does `import CSV from './data.csv?raw'`. A reviewer
    extracted the CSV literal from the built bundle
    (`build/assets/index-*.js`) and found it byte-for-byte identical to
    `src/data.csv`: same UTF-8 BOM (emitted by esbuild as the six-character
    escape `﻿`, decoding at runtime to the same U+FEFF the CRA/webpack
    build produced), 543 newlines splitting into 544 parts (1 header + 542
    data rows + 1 trailing empty part), no CRLF. The Matrix footer's
    `Number of matching Eyes: N/542` line, present in all ten L2 fixture
    rows, pins the row count independently — a truncated or re-encoded CSV
    could not have passed L2 without that count moving. The bundle
    inspection is corroborating; the L2 replay (below) is the decisive
    proof, since it exercises all 542 rows through the rendered app.
  - **The CRA-isms (finding 3) are translated.**
    `process.env.REACT_APP_VERSION` → `import.meta.env.VITE_APP_VERSION`
    (`src/misc/Footer.tsx`), `process.env.PUBLIC_URL` →
    `import.meta.env.BASE_URL` (`src/misc/NavBar.tsx`),
    `process.env.NODE_ENV === 'production'` → `import.meta.env.PROD`
    (`src/index.tsx`, `src/misc/GoogleAnalytics.ts`), `public/index.html`
    moved to the project root with `%PUBLIC_URL%/` → `/`.
  - **The `PUBLIC_URL`/`REACT_APP_VERSION` blind spot (§6.2) bit once, in
    this phase, and was caught by the manual checklist, not by either
    gate.** Full account in §6.2's updated text; short version: the
    `%PUBLIC_URL%/` → `/` substitution missed
    `<meta name="msapplication-config" content>` because Vite rewrites
    root-absolute URLs only in attributes it treats as asset references,
    and `meta[content]` is not one — the tag shipped pointing at
    `/browserconfig.xml` instead of `/icl-calc/browserconfig.xml`, a 404 in
    production. `readAll()` never reads page metadata, so both L1 and L2
    stayed green throughout. A human diffing every built `<head>` tag
    against the oracle's caught it; fixed in `4a64607`. This is the
    programme's first live confirmation that the blind spot recorded here
    is real, not hypothetical.
  - **`.nvmrc` now reads `v22`**, walked up from `v16` across the three
    commits `db97898` (Vitest requires Node ≥18, so `test` moved off 16),
    `2241387` (corrected `.nvmrc` to `v20` and the rationale for the
    Vitest pin), and `1b82f17`/`6c3bbfd` (all three CI jobs unified on
    `node-version-file: '.nvmrc'`, walked to 22, the newest LTS, after
    confirming every gate green on it). The old Node 16 ceiling was CRA's
    webpack 4 build chain hitting `ERR_PACKAGE_PATH_NOT_EXPORTED` on 18+
    (§10's "Node version target for Phase 0" bullet); that chain no longer
    exists.
  - **`scripts/link-bins.js` is deleted** (`c1923bc`), as this document
    already anticipated in the "CI was dead" bullet above. The regenerated
    lockfile is `lockfileVersion: 3` with a populated top-level `packages`
    object (confirmed: `require('./package-lock.json').packages` is
    truthy), which is the field `npm ci` needs to know which installed
    packages declare a `bin` and symlink them into `node_modules/.bin`
    — the 2021-era `lockfileVersion: 2` lockfile never carried it. All
    three "Repair node_modules/.bin symlinks" CI steps (`test`,
    `e2e-replay`, `deploy`) were removed along with the script; `npm ci`
    alone now populates `.bin` correctly (confirmed: 45 entries, no
    dangling symlinks).
  - **Exactly one snapshot changed in rendered content**: NavBar's
    `href="/"` → `href="/icl-calc/"`, appearing once in
    `NavBar.test.tsx.snap` and nine more times (one per rendered route/state)
    in `ICLContainer.test.tsx.snap`, because `import.meta.env.BASE_URL` is
    always populated (`/icl-calc/`) where CRA's `PUBLIC_URL` was empty
    under test. Every other changed `.snap` file differs only in its
    one-line Jest/Vitest tool-signature header comment. Production
    behaviour is equivalent — the oracle itself serves `/icl-calc/`.
  - **Runtime dependency versions moved within their already-declared
    semver ranges** when the lockfile was regenerated: `react` 17.0.1 →
    17.0.2, `react-router-dom` 5.2.0 → 5.3.4, `formik` 2.2.6 → 2.4.9,
    `date-fns` 2.19.0 → 2.30.0, `@amcharts/amcharts4` 4.10.17 → 4.10.40.
    `src/formulas.ts` (the calculation engine) imports only from
    `./types`, whose sole external import is a display-only date-formatting
    call — the numeric core is isolated from all five packages. `@types/node`
    moved `^12.20.4` → `^22` (a types-only devDependency; the fix round in
    Task 5 chose this over `--legacy-peer-deps` specifically so Phase 3b's
    React 19 peer-dependency signals aren't suppressed by a blanket flag
    left behind here).
  - **Lint coverage narrowed, deliberately, and is tracked separately.**
    Dropping `eslintConfig.extends: ["react-app/jest"]` (it no longer
    applies once `react-scripts` is gone) also dropped that config's
    `jest/*` and `testing-library/*` rule overrides for `**/*.{spec,test}.*`
    — confirmed zero active rules from either plugin post-change, against a
    non-trivial set beforehand. Not restored here: re-enabling risked
    surfacing new failures across ~20 test files as unrelated churn.
    Tracked as [#63](https://github.com/ruipinge/icl-calc/issues/63).
  - **Gates, all re-run on Node 22 immediately before Task 6's PR**: `npm
    test` 158 passed / 3 skipped; `npx tsc --noEmit` clean; `npm run lint`
    exit 0; `npm run build` exit 0; `SUBJECT_ONLY=1` L2 setup + replay, 2
    passed, including "the build under test reproduces the oracle exactly."
    `src/golden/expected.json` and `src/data.csv` unchanged.
  - **The browser support floor moved, and the owner has decided to accept
    it (final review, Phase 3a Task 6): ESM-only at `chrome87`, `edge88`,
    `firefox78`, `safari14` (all late 2020/early 2021).** This was already
    Vite 4's implicit default (`build.target: 'modules'`, esbuild's
    shorthand for the same four versions) when `vite.config.ts` set no
    `build.target` at all. It is now **pinned explicitly** —
    `target: ['chrome87', 'edge88', 'firefox78', 'safari14']` in
    `vite.config.ts`'s `build` block — specifically so a future Vite 5 or
    6 upgrade cannot move this floor silently; any change to it is now a
    visible diff line someone has to justify, not an implicit default that
    shifts underneath the project. Confirmed the pin is a no-op for the
    current toolchain: built before and after adding it and diffed
    `build/` recursively (`diff -rq`) — every asset, including hashes, is
    byte-identical.
    The oracle instead shipped `react-scripts`' classic build: ES5 output
    plus a `<script nomodule>` fallback bundle, covering browsers far older
    than 2020, degrading gracefully rather than failing outright. The
    **effect** is the difference in kind: the oracle's ES5 path ran
    (slower, unoptimized) on a pre-2020 browser, while a browser below the
    pinned floor gets a blank page — `<script type="module">` is simply
    skipped, with no fallback bundle to fall through to. This is the
    accepted, permanent behaviour below the floor, not a transitional gap.
    Separately, **autoprefixer is no longer in the dependency tree** —
    `react-scripts` bundled it via its PostCSS config; Vite doesn't add one
    unless the project does. A reviewer counted `-webkit-` occurrences in
    the built CSS: 570 in the oracle's `build/`, 38 in Phase 3a's — the
    remaining 38 are prefixes authored directly in source, not autoprefixer
    output. In practice this means any CSS feature needing a `-webkit-` (or
    other vendor) prefix to work on the pinned floor's oldest browsers must
    now be prefixed by hand in source, or accepted as broken there — nothing
    in the build adds it automatically.
    **`package.json`'s dead `browserslist` block (`"production"`/
    `"development"`, formerly just above `"prettier"`) has been deleted**,
    not left in place — confirmed nothing else in the repo reads it
    (`grep -rn browserslist`, excluding `node_modules` and the lockfile,
    now matches only this paragraph). It predated Vite and autoprefixer's
    removal; nothing in the Vite/esbuild/PostCSS toolchain ever read it.
    **Neither CI gate can detect a regression against this floor.** L1
    (`npm test`) runs in jsdom, not a real browser. L2 (Playwright) drives
    a current Chromium, which is always far above the pinned floor
    regardless of what `target` says — Playwright has no mechanism here to
    exercise `chrome87`/`edge88`/`firefox78`/`safari14` specifically, so a
    change that silently raised the floor further (e.g. a later
    `build.target` bump) would still pass both gates. Anyone relying on the
    floor holding must check `vite.config.ts`'s `target` directly, not
    infer it from green CI. **Explicitly out of scope for Phase 3a: adding
    `@vitejs/plugin-legacy` or widening `build.target` to restore the old,
    pre-2021 floor.** This bullet exists so the decision and its
    consequences are recorded and owner-visible, not discovered later as
    an unexplained regression.
- **Written confirmation that the row-level dataset may be published publicly**
  remains outstanding. Blocks nothing here; tracked in the Treeye roadmap.
