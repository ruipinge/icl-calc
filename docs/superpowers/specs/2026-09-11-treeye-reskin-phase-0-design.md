# Treeye reskin phase 0 — make the reskin reviewable: design

**Date:** 11 September 2026
**Status:** proposed
**Issue:** #121 (phase 0 of epic #120). Blocks #122.
**Companion:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
(§6.3 versioning, §7.3 the golden-master stop rule)

---

## 1. What this is

A design for making the Treeye reskin (#122) **reviewable**, without changing a
single pixel of what a clinician sees.

The reskin cannot be reviewed today for two independent reasons: its diff is
dominated by DOM snapshots that encode Bootstrap class strings, and CI contains
no mechanism that can observe a visual regression at all. This phase removes
both obstacles and captures a record of the current arrangement before it is
gone.

It ships no behaviour change, and therefore cuts no version.

---

## 2. What is actually true today

Both #120 and #121 state three facts that measurement contradicts. Corrections
are posted on each issue; they are restated here because this document is what
phases 1–3 will be read from.

### 2.1 Snapshot volume

| | lines |
|---|---|
| DOM snapshots (`asFragment()`) — 12 files, 22 assertions | 15,314 |
| `src/golden/__snapshots__/replay.test.ts.snap` — data, not DOM | 485 |
| **total** | **15,799** |
| of the DOM lines, literal `class=` attribute lines | 1,782 |
| `src/__snapshots__/ICLContainer.test.tsx.snap` alone | 10,759 |

The issues say 26,425. That figure was never correct: the all-time maximum
across every commit in this repository that has ever touched a `__snapshots__`
path is 15,799, reached at `ea2cb3c` and unchanged since.

The shape matters more than the total. **`ICLContainer.test.tsx.snap` is 68% of
all snapshot lines** and holds nine `asFragment()` assertions, three of which
render the identical thing — `renders without crashing`, the first assertion in
`resets form when clicking reset button`, and `renders Patient form on # route`
are the same component at the same hash.

### 2.2 There is no visual coverage in CI, not even one component

`e2e/histogram-visual.spec.ts` is a **capture tool**, and says so:

> This is a capture tool, not an assertion: it is deliberately NOT part of the
> `test` or `replay` projects and never runs in CI.

`playwright.config.ts` agrees ("Runs against the subject build, never in CI").
Confirmed against the workflow: the only Playwright invocation in
`.github/workflows/main.yml` is `npm run replay` in the `e2e-replay` job, which
is `playwright test --project=replay`. Nothing invokes `--project=visual`.

So the premise of this phase is stronger than written, and #121's instruction to
treat that file as "the existing pattern to follow" is misleading for the
*coverage* work — followed literally it produces four more capture tools that
also never run. It is exactly the right pattern for the **layout baseline**,
which is a capture task, and its `waitForStableSvg` helper and full-page shot
are reused there.

### 2.3 The base path does not change

#121's preview section still says to build the preview at `/tools/icl-calc/`;
its own later section and the owner's decision of 2026-09-10 say `/icl-calc/`.
#120's hazard list still carries the superseded three-way version. The base path
is **`/icl-calc/` everywhere** — production, preview, and
`tools.treeye.science/icl-calc/` after #123. `base` in `vite.config.ts`,
`import.meta.env.BASE_URL` in the navbar brand link, and `test.env.BASE_URL` all
stay exactly as they are. The single exception is §7.1's gh-pages stopgap.

---

## 3. Non-goals

Explicitly out of scope, and not to be "helpfully" fixed:

- **Any visual change.** This phase is `chore:`/`test:`/`ci:` only, with the
  single documented exception below.
- **`src/golden/expected.json`, `src/data.csv`** — CI-protected (§7.3 of the
  modernization spec). Nothing here touches rendering, so L2 stays green
  throughout. If it goes red, the test refactor is wrong, not the fixture.
- **`src/golden/__snapshots__/replay.test.ts.snap`** — see §4.1.
- **#127** (`@types/node` ^26 against `.nvmrc` v22) and `e2e/.nvmrc`'s inert
  `v20`. Changing the runtime under build, test and deploy would destroy the
  zero-behavioural-impact property this phase depends on.
- **#41** (posterior keratometry), including the TODO at `src/formulas.ts:45`,
  which marks an unwritten clinical safety warning and must not be deleted.
- **Automatic pruning of accumulated gh-pages bundles** (§7.1).
- **#65** (input presets) — rides at the end of phase 1, not here.

### 3.1 The one exception: #129

Phase 0 was scoped to touch no source. It touches exactly two lines, in
`src/patient/FieldWithUnit.tsx`, and this section records why rather than
leaving the spec contradicting the work.

`FieldWithUnit` renders `<label htmlFor={name + 'field'}>` but never set that
id on either the `<Field>` or the disabled `<input>`, so the label was
associated with nothing. It affects **23 of the 27 inputs on the Patient tab**
— Biometry 6, CorneaProfile 9, ICLPower 4, SpectacleRefraction 4. `Info`'s four
carry explicit ids and are unaffected.

It is in scope for two reasons:

- **It blocks the agreed strategy.** Neither `getByLabelText` nor
  `getByRole(…, { name })` can reach those inputs, and the alternative,
  `container.querySelector('input[name=…]')`, is what `testing-library/
  no-node-access` forbids here. §4 cannot be applied to the clinical form
  without it.
- **It is a real defect in a clinical tool**, independent of the reskin: a
  screen reader announces 23 numeric surgical-planning inputs unlabelled.

It satisfies the phase's actual invariant — **zero visual impact** — because an
`id` attribute renders nothing, and L2 is unaffected because `e2e/lib/app.ts`
locates fields by `input[name="…"]`. Verified: L2 green, coverage unchanged,
golden master untouched.

It lands as its own pull request ahead of the conversions (§9), so the source
change is reviewed on its own rather than inside a test refactor.

The snapshot move it causes is **147 insertions, 0 deletions**, every changed
line an added `id="…field"` attribute. That the ICLContainer snapshot already
recorded 138 `for="…field"` attributes while asserting nothing about any of
them is §4's argument made by the fixtures themselves.

---

## 4. The snapshot strategy

**Assert rendered text, ARIA roles and accessible names instead of serialising
the DOM** — with three boundaries the issue does not draw.

The precedent is already in the repository. `src/misc/Footer.test.tsx` pairs its
snapshot with a hand-written test whose comment reads:

> The snapshot above would accept any commit string, including an empty one.
> This asserts the thing #94 actually needs.

This strategy is that comment applied to the other eleven files.

### 4.1 Boundary one: DOM snapshots only. The golden-master data snapshot is untouchable

`src/golden/__snapshots__/replay.test.ts.snap` (485 lines, 2 assertions)
snapshots **plain JavaScript objects**, not markup: `HISTOGRAM_DATA` bins and
the `buildZones` percentile bands, both computed over the real 542-row dataset.
It contains no presentation, it is the numeric gate #51 was proved against, and
text-and-roles assertions have nothing to say about it.

It is **out of scope entirely**. This is the most important line in this
document: "convert the snapshots", read without it, points directly at the one
snapshot file that must not move.

### 4.2 Boundary two: SVG geometry is data, not presentation

`src/normality/__snapshots__/index.test.tsx.snap` carries 91 `d="…"` path
attributes. `Gauge.test.tsx.snap` is almost entirely inline positioning
percentages. Both are **computed from clinical data**, and an SVG chart exposes
almost no accessible text — so converting these to text-and-roles would delete
real coverage of the hand-rolled charts while reporting it as a cleanup. That is
precisely the failure mode this repository has found six times.

For `src/normality/` the replacement is **targeted geometry assertions**, and
the model already exists in-repo: `Histogram.test.tsx` asserts bar count, and
gridline `x1`/`x2` against `PLOT_INSET_LEFT`/`PLOT_INSET_RIGHT` at two container
widths. Its comment records that the bug it catches — histogram and gauge
drifting out of alignment — was found by eye, by nothing automated. That file is
the best test in this repository and it is the pattern for the charts.

### 4.3 Boundary three: some snapshots are load-bearing, and must be named on the way out

Conversion is **per file and reviewed**, never mechanical, because at least two
current snapshots are the only thing asserting something real:

- **`NavBar.test.tsx.snap` is the base-path guard.** It is the only assertion
  that the brand link renders `href="/icl-calc/"`. `vite.config.ts` pins
  `test.env.BASE_URL` specifically to keep it one, and says so in a comment:
  "recording '/' would have the L1 suite assert a path the shipped app never
  uses, and stop it catching a real base-path regression". Deleting it silently
  removes that guard. It becomes an explicit `toHaveAttribute` assertion.
- **`title=` tooltips on Matrix and VaultStatRows row headers** are clinical
  copy ("Average Vault size in micrometres") currently asserted only by
  serialisation. They become explicit accessible-description assertions.

Each converted file gets a short comment recording what the snapshot was
asserting and where that assertion now lives.

### 4.4 Per-file conversion

| File | snap lines | Replacement |
|---|---|---|
| `misc/NavBar` | 30 | brand `href` = `/icl-calc/`; Reset button by role |
| `misc/TabLinks` | 56 | four links, accessible names, `href`s, **order** |
| `misc/Footer` | 97 | keep existing commit-link test; add version/text assertions |
| `patient/Info` | 108 | field labels in order, values, validation messages |
| `patient/CorneaProfile` | 367 | as above, plus grouping |
| `matrix/components` | 49 | row header + cell values as a text matrix |
| `matrix/VaultStatRows` | 169 | row headers, `title` descriptions, value matrix |
| `matrix/VaultDistributionRows` | 275 | as above |
| `matrix/index` | 631 | column headers (lens sizes), row order, `getNumEyes` |
| `regression/index` | 172 | headings, labels, computed values |
| `normality/Gauge` | 72 | **geometry** — zone boundaries, marker position |
| `normality/index` | 2,529 | **geometry** — six charts, bar counts, inset alignment |
| `ICLContainer` | 10,759 | per-route field order and grouping; drop the three duplicate renders |
| `golden/replay` | 485 | **unchanged — out of scope (§4.1)** |

`ICLContainer` is converted **last**, after the patterns in the rows above it
are established and reviewed, because it is the whole application rendered nine
times and benefits from every helper the earlier conversions produce.

### 4.5 Coverage will not move, and here is why

v8 coverage is produced by `render()`, not by `toMatchSnapshot()`. Every
existing `render(...)` call is retained; only the assertion downstream of it
changes. No covered line is removed, so the floors
(98.96 / 98.11 / 99.39 / 99.13) are unaffected.

The only way this phase could trip them is by **deleting a render**. It does not
— including the three duplicate `ICLContainer` renders, whose *assertions* are
deduplicated while the renders they wrap are kept if removing one would drop a
line. This is checked by running coverage before and after, not assumed.

No threshold is lowered. If coverage drops, the cause is understood before
anything else happens.

Measured 11 September 2026: current coverage is **exactly** the floor on all
four metrics (98.96 / 98.11 / 99.39 / 99.13 — 477/482, 104/106, 163/164,
457/461). There is no headroom whatsoever, so a single uncovered statement fails
CI. This makes the "delete no render" rule above a hard constraint rather than
a precaution.

### 4.6 What #65 needs, and what it loses

Form values remain visible to tests, and become more so: `getByLabelText('Name')
.value` names the value, where today it is buried in 10,759 lines nobody reads.
Input presets (#65) will therefore have assertions available to it.

What *would* become invisible is any attribute nobody thinks to assert. That is
why §4.3 exists and why inputs are asserted by **accessible name and
description**, not by label text alone.

### 4.7 The alternative considered and rejected

A custom snapshot serializer stripping `class` and `style` while keeping DOM
shape. It preserves snapshot ergonomics and genuinely makes class edits
invisible.

Rejected: #122 drops Bootstrap, which changes **element nesting** — the
`.row` / `.col-md-4` / `.form-group` / `.input-group` wrappers disappear — so a
structure-only snapshot still churns heavily in exactly the pull request this
phase exists to make reviewable. It solves the class problem and not the reskin
problem.

---

## 5. Visual coverage

Four routes — Patient, Normality, Matrix, Regression — plus the shell, at two
viewports, in **two complementary fixture formats**. Both run in CI.

### 5.1 Aria snapshots — structure, restyle-proof

Playwright's `toMatchAriaSnapshot` (available since 1.49; this harness resolves
to **1.62.1**) records the accessibility tree — roles and accessible names, no
classes, no styles — as YAML. It is platform-independent text, it diffs
readably, and it is stable across restyling by construction.

It carries **arrangement**: which controls exist on which tab, their accessible
names, and their order. This is the half of the layout baseline that survives
#122 and can be compared mechanically rather than by eye.

To verify during implementation: whether the aria tree differs between the two
viewports. This application applies responsiveness through Bootstrap CSS rather
than conditional rendering, so one snapshot per route is expected to suffice —
but `Histogram` uses a `ResizeObserver`, so this is checked rather than assumed,
and per-viewport snapshots are taken if it turns out to matter.

### 5.2 Screenshots — appearance

`toHaveScreenshot` per route and per shell element, at both viewports.

**Viewports:** 1280×900 (matching the existing capture tool) and 390×844.

**Platform.** Playwright screenshots are platform-dependent and suffixed
accordingly, so a baseline generated on darwin is never used by a linux runner.
Baselines are therefore **generated in the official Playwright container**
(`mcr.microsoft.com/playwright:v1.62.1-noble`, matching the resolved version)
and asserted in CI on linux. Docker is available on the maintainer machine; the
regeneration command is documented in `e2e/README` alongside the existing
harness notes.

**These baselines are committed, and #122 will regenerate them wholesale.** That
is correct and expected: #122 *is* the deliberate visual change, and regenerating
there is a reviewed act performed against Playwright's diff images. Their value
is what they catch afterwards — and during #122, an *unintended* change to a
route the reskin was not editing.

This is distinct from the layout baseline in §6, which is deliberately **not**
committed and **not** asserted.

### 5.3 CI wiring

A new Playwright project, `visual-assert`, matched to the new spec files and
added to a workflow step that actually runs it — the omission §2.2 describes is
the thing being fixed, so the wiring is the deliverable, not the spec file.

It runs against the subject build on port 4022, like `replay`. **It must not run
concurrently with the L2 replay**: `reuseExistingServer: true` on a fixed port
means a second run silently validates the first's build. It therefore runs as an
additional step inside the existing `e2e-replay` job, sequentially after
`npm run replay`, rather than as a parallel job.

The existing `visual` project and `histogram-visual.spec.ts` are left exactly as
they are — a capture tool that does not run in CI, which is what they are for.

---

## 6. Layout baseline

A record of **arrangement**, not appearance, captured in the same pass as §5
because it is the same matrix of routes and viewports, and because it is the
last opportunity: the current look disappears from every URL when #122 merges.

**Captured:** which fields are on which tab and in what order; how fields are
grouped and labelled; what sits beside what; the page skeleton
(navbar → tabs → content → footer); the row and column structure of the Matrix
and Regression tables; where charts sit relative to their controls.

**Not captured:** input borders, fills, focus rings; fonts, colours, spacing
units; button and control treatment; the validation-icon placement `App.scss`
hand-corrects; any Bootstrap-specific visual idiom. Every individual control is
*expected* to change in #122.

**It is a reference, not a gate.** It is not wired as an assertion phase 1 must
satisfy — a pixel fixture keyed to control styling would fail on every restyle
and be disabled within a day. The captures are **attached to #121 and #122**,
not committed.

The half of this that *is* machine-checked lives in §4 and §5.1: field order,
grouping, labels and roles become assertions that survive restyling, so an
accidental reordering in #122 fails a test while a restyled input does not. The
screenshots carry only what text cannot — spatial arrangement and relative
placement.

---

## 7. Preview deployment

Both, and they are not equals. Decided by the owner on 2026-09-10.

### 7.1 gh-pages under `preview/` — first, because it needs no secrets

Publishes the integration branch via the existing `peaceiris/actions-gh-pages`
action's `destination_dir: preview`.

**This requires editing the production deploy step.** That step currently
publishes `./build` to the branch root with no `keep_files`, and the action
wipes the destination by default — so without `keep_files: true` on the
production deploy, the next release to `main` deletes the preview. This is the
one genuinely risky edit in a phase that otherwise touches nothing that ships,
so it is its own pull request, merged alone and watched.

Accepted price, stated by the owner: content-hashed bundles accumulate on
`gh-pages` indefinitely. **No automatic pruning is built.**

**It needs a base override**, and is the only destination that does: it serves
from `/icl-calc/preview/`, so it is built with `--base=/icl-calc/preview/`.
A consequence worth stating plainly: those are **not the bytes L2 validated**,
because they are a second build with a different base. That, and the base
override itself, are why this is a stopgap to be retired once §7.2 is up rather
than maintained in parallel.

Neither preview may touch gh-pages production content, cut a version, or run on
`main`.

### 7.2 Cloudflare Pages — authoritative once wired in

Deliberately **not** the two-repos-into-one-project problem, which is #123. One
project, one repository, no routing layer.

```
project name   icl-calc-preview      ->  icl-calc-preview.pages.dev
secrets        CLOUDFLARE_API_TOKEN      already set on the repository
               CLOUDFLARE_ACCOUNT_ID     already set on the repository
```

The token is a Custom Token with `Account` · `Cloudflare Pages` · `Edit` and no
zone permissions; this project has no custom domain and needs none.

**Direct Upload, not the Git integration.** The Git integration would have
Cloudflare build the application, shipping bytes that never passed this
repository's gates. Direct Upload keeps CI authoritative: lint, typecheck, unit
tests, L1 and L2 run here, and exactly those bytes are uploaded.

**Upload a wrapper directory, not the build.** Direct Upload serves the uploaded
directory as the site root, but the application must live at `/icl-calc/` so the
base path is identical to production and to its eventual home:

```
mkdir -p upload/icl-calc && cp -r build/* upload/icl-calc/
```

giving `icl-calc-preview.pages.dev/icl-calc/`, from the same build L2 validated.

**One subtlety to verify on first deploy.** Cloudflare serves a deployment at
the stable `<project>.pages.dev` hostname only when it is a *production*
deployment of that project; a preview deployment gets a per-commit
`<hash>.<project>.pages.dev` alias instead. Wrangler infers the branch from the
CI environment, so an integration-branch deploy may land as a preview alias and
produce a URL that changes every push — which defeats "a reviewable preview
URL". `--branch` is therefore passed explicitly, and the resulting hostname is
confirmed against the first real deployment rather than assumed.

### 7.3 The preview must not be indexed

Owner decision. `pages.dev` hostnames are crawlable, and an indexed second copy
of a clinical tool at an unadvertised URL is not wanted.

**Scope the exclusion to the preview hostname, not the application.** A
`_headers` file at the **root of the upload directory** — `upload/_headers`, not
inside `upload/icl-calc/` — carrying:

```
/*
  X-Robots-Tag: noindex
```

**Do not put `noindex` in the application's own `index.html`.** It would follow
the build into production and silently de-index the real tool. #126 tracks
re-enabling indexing when #123 goes live, and exists because that failure is
silent: nothing breaks, no test goes red, traffic simply stops.

### 7.4 Which is authoritative

**Cloudflare, once it is up.** Two previews means someone has to know which to
trust, and this phase exists to remove ambiguity from review, not add it. This
is stated explicitly wherever the preview URL is documented — README and the
pull request descriptions for #122.

---

## 8. Proof obligations

Every new or changed test is proven capable of failing. Both directions are
reported, with real output, per this repository's standing rule.

### 8.1 The measured baseline

Taken on 11 September 2026 in a throwaway worktree at `d2a94df`, before any
conversion. Baseline suite: **26 files, 211 tests, all green**, coverage exactly
**98.96 / 98.11 / 99.39 / 99.13** — identical to the floors, so there is *zero*
headroom and any coverage loss at all fails CI.

**Measurement A — two class names.** `btn-danger` → `btn-primary` in `NavBar`,
and `text-right` → `text-end` (the real Bootstrap 4→5 rename) everywhere in
`.tsx`:

```
13 source lines changed, 7 files
  -> 15 tests failed across 9 of 26 files, every failure a snapshot
  -> 898 lines of fixture diff (449 added, 449 deleted), 9 files
```

**69× amplification** from the smallest edit representative of the reskin.

**Measurement B — the whole class vocabulary.** Every literal `className` token
in every `.tsx` prefixed, simulating adoption of a different design system's
vocabulary without touching structure:

```
150 source lines changed, 16 files
  -> 2,916 lines of fixture diff (1,458 added, 1,458 deleted), 12 files
  -> after `npm test -u`: 26 files, 211 tests, ALL PASS
```

That last line is the argument for this phase, stated as a fact rather than a
worry: **a wholesale change of every class name in the application regenerates
clean and no test notices.** The fixtures are not protecting anything a reskin
can break; they are only large enough to hide what it does break.

Both figures are floors, not estimates. #122 also removes element nesting — the
`.row` / `.col-md-4` / `.form-group` wrappers — which reindents subtrees that
neither measurement touched.

### 8.2 The gate #121 sets

Run on a throwaway commit that never reaches a pull request:

1. **Class-name-only edit** — repeat measurements A and B above. The expectation
   after conversion is zero failing tests and a **zero-line** fixture diff,
   against the 898 and 2,916 recorded here.
2. **Behavioural change, two mutations**, because they fail differently:
   - reorder two fields in `CorneaProfile` — must fail on **structure**;
   - change a rendered clinical value's rounding in a Matrix row — must fail on
     **content**.
   Both restored, both re-run green.
3. **Chart geometry** — shift `PLOT_INSET_LEFT`, see red, restore, see green.
4. **Visual coverage** — change a colour and a spacing value in `App.scss`, see
   the screenshot assertions go red, restore, see green.

### 8.3 Standing verification, every pull request

```
npm run lint
npm run format:check
npx tsc --noEmit
npm test
```

and, for any change under `src/`, the L2 browser replay:

```
npm run build
npm --prefix e2e ci --prefer-offline
bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
```

Where nothing under `src/` changed, L2 is skipped **with that reason stated**.

L2 binds a fixed port (4022) with `reuseExistingServer: true`. **Never two
replays concurrently** — the second silently validates the first's build and
goes green.

Exit codes are checked with a standalone `echo $?`, never through a pipe:
`${PIPESTATUS[0]}` is empty in this shell. Background-task wrapper status is not
trusted; results are read from log content.

---

## 9. Delivery

Worktree per pull request, all targeting the integration branch **`treeye-reskin`**,
never `main`. Nothing merges until the owner says so. Merge one at a time,
watching each land before the next.

| # | Branch | Scope |
|---|---|---|
| 1 | `docs/121-phase-0-spec` | this document |
| 1b | `fix/129-fieldwithunit-label-association` | #129, the §3.1 exception — merged alone, ahead of the conversions |
| 2 | `test/121-snapshot-strategy-shell-and-forms` | NavBar, TabLinks, Footer, Info, CorneaProfile — establishes the pattern (~658 snap lines) |
| 3 | `test/121-snapshot-strategy-tables` | matrix ×4, regression (~1,296 lines) |
| 4 | `test/121-snapshot-strategy-charts` | normality index, Gauge — geometry (~2,601 lines) |
| 5 | `test/121-snapshot-strategy-container` | ICLContainer (10,759 lines) |
| 6 | `test/121-visual-coverage` | aria snapshots, screenshots, the `visual-assert` project, CI wiring |
| 7 | `ci/121-gh-pages-preview` | `destination_dir` **and** `keep_files: true` on the production deploy — merged alone, watched |
| 8 | `ci/121-cloudflare-preview` | Direct Upload, wrapper directory, `_headers` noindex |

The layout baseline (§6) is captured during 6 and attached to #121 and #122. It
produces no commits of its own.

Each worktree is removed after its pull request merges.

---

## 10. Release policy

**This phase cuts no version.** `chore:`, `test:` and `ci:` commits only. The
major belongs to phase 1 (#122).

Two mechanics matter here regardless:

- A **line-initial breaking-change footer in a commit body cuts a major**, and it
  works.
- A **`!` type suffix does not.** `feat!:` cuts nothing at all, not even a minor:
  the angular preset reads the type as `feat!` and matches no rule.

**The hazard:** that footer token, appearing at the start of any line in a commit
body, triggers a major — *including in prose describing this rule*. It has
happened twice in this repository, the second time cutting a spurious v2.0.0
withdrawn by hand (see v1.9.2's release notes). The bare uppercase token is never
written in a commit or merge body; "the breaking-change footer" is written
instead. Line wrapping is not predictable, so the token itself is the hazard.

Merges are squashed with an explicit `--subject` and `--body-file`. A long pull
request body never becomes the commit body: semantic-release reads it.

---

## 11. Hazards

| Hazard | Handling |
|---|---|
| Golden master moves | Out of scope by construction (§3, §4.1). L2 green throughout. Red means the refactor is wrong; no fixing forward, no regenerating. A deliberate correction needs an `oracle/*` branch and per-value justification (§7.3 of the modernization spec). |
| Coverage floors trip | §4.5 — no render is deleted; coverage measured before and after; no floor lowered. |
| Two L2 replays concurrently | §8.3 — the visual project runs sequentially inside `e2e-replay`, not as a parallel job. |
| `keep_files` edits the production deploy | §7.1 — its own pull request, merged alone and watched. |
| Cloudflare preview URL is unstable | §7.2 — `--branch` passed explicitly; hostname confirmed against the first real deployment. |
| `noindex` leaks into production | §7.3 — `_headers` at the upload root, never `index.html`. #126 tracks re-enabling. |
| Required checks silently stop being enforced | Job **display names** are the required-check names — "Lint, typecheck and unit tests", "Golden-master stop rule (expected.json, data.csv)", "L2 browser replay of the golden master". None is renamed. Job ids (`test`, `golden-master-guard`, `e2e-replay`, `deploy`) are what `needs:` uses. |
| The frozen oracle is written to | `../icl-calc-oracle` (tag `golden-master-oracle` → `789ac2d`) is never written to. |

---

## 12. Gate

From #121, with §2's corrections folded in:

- A class-name-only change produces a small, readable test diff — **demonstrated
  with before and after numbers**, not asserted.
- A real behavioural change still fails — demonstrated in both directions.
- Visual coverage exists for all four routes plus the shell at two viewports,
  **runs in CI**, and has been shown failing and passing.
- The layout baseline is captured and attached to the issues.
- The integration branch deploys to a reviewable preview URL, and which preview
  is authoritative is stated where the URL is documented.
- `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm test` and L2
  all pass; coverage floors unchanged; the golden master untouched.
- No version cut.
