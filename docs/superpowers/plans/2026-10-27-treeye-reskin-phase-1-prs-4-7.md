# Treeye reskin phase 1 — PRs 3a–7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every region of the calculator legible enough for clinical and surgical use, and finish the reskin. That means rebuilding the patient form, the result tables and the charts on the Treeye patterns, fixing #136, #138 and #139, emptying the grid shim, and then adding built-in presets (#65).

**Architecture:** Five pull requests against `treeye-reskin`, merged one at a time, with each publish watched before the next.

- **PR 3a** applies #173's measured legibility fixes to the token and base layer, and adds a non-blocking contrast report.
- **PRs 4, 5 and 6** each rebuild one region on its pattern: the patient form, the result tables, the charts. Each deletes the grid-shim blocks that region used.
- **PR 7** adds presets after the reskin is complete, so a red L2 is never ambiguous between the two.

**Tech Stack:** React 19, Formik 2, Vite 8, Vitest 5, Playwright 1.64.1 (containerised), plain CSS custom properties, `@axe-core/playwright` (new, `e2e/` only).

**Spec:** `docs/superpowers/specs/2026-09-14-treeye-reskin-phase-1-design.md`, plus the decisions recorded since it was written:

- #172: the header. Merged in #179.
- #173: the contrast findings and the owner's four decisions, in its comment of 2026-10-25.

Read both before starting a task.

## Changes since the spec

Where these disagree with the spec, these win. Each was decided after the spec, with the reason recorded where it was decided.

| spec | now | decided in |
|---|---|---|
| §4.2 `--chrome: #f6f2f7` | `#ddd3e6` | #172 / #179 |
| §4.3 chrome closed by a 2px `--spectrum` rule | a 1px `--rule` bottom border, as on treeye.science | #172 / #179 |
| §6.2 "zero cells rendered in `--rule`" | **superseded.** `--rule` on paper is 1.26:1, so a clinical `0` would be near-invisible, and #173 decision 1 sets AAA for clinical values. Zero cells stay `--ink`; nothing de-emphasises them. **Owner to confirm** when reviewing PR 5. | #173 |
| §7 gauge "crimson → ember → jade → ember → crimson" | unchanged. #173 P7 named `--leaf-red` for the outer bands; both clear 3:1, and the spec's crimson is kept | #173 |
| §10 docker command | the plan's command below, which runs the container as the invoking user | #144 / `CLAUDE.md` |
| §11 eight PRs | **PR 3a** inserted before PR 4 | #173 decision 2 |

## Global Constraints

- **`src/data.csv` and `src/golden/expected.json` are never edited.** CI-enforced by `golden-master-guard`. If L2 goes red, stop: do not fix forward and do not regenerate. Spec §9.
- **L2 reads these, and every one must survive every task unchanged:**
  - the `name` attributes of all form fields;
  - outputs read with `.inputValue()`, so they stay `<input>`: `iclSphere`, `iclCylindre`, `iclAxis`, `iclSphericalEquivalent`, `age`;
  - `select[name="patient.eye"]` and `select[name="corneaProfile.previousSurgery"]`;
  - exactly 1 `<table>` on Floating Matrix and 2 on Regression;
  - the `textContent` of every `th`/`td` in every `tr`;
  - `[data-testid="matrix-summary"] li` and its text;
  - 6 × `[data-testid="gauge"]`, whose **first** `<svg>` descendant is the pointer.
- **The gauge is colour only.** `zoneHeight` stays 12, `pointer.width` stays 4, and no `<svg>` is added inside a gauge container ahead of the pointer. Spec §7.
- **No number formatting changes.** `2` stays `2`, not `2.00`. Padding decimals changes rendered text, which is a golden-master change. Tables align right on tabular figures and accept the ragged decimal. Spec §6.4.
- **Never write the line-initial breaking-change footer token in any commit body.** Write "the breaking-change footer". Spec §12.
- **Coverage floors are 98.96 / 98.11 / 99.39 / 99.13.** Never lower one. Deleting covered code lowers the percentage without anything becoming untested; that is still the owner's call.
- **Every new or changed test is proven capable of failing.** Break, see red, restore, see green, report both, with each assertion mutated individually.
- **Contrast** (#173 decision 1, pending the owner's visual check in Task 2):
  - clinical values, and anything qualifying them (units, row and column labels), at least **7:1**;
  - all other text at least **4.5:1**;
  - input boundaries, focus and state at least **3:1**;
  - minimum text size **0.8rem**;
  - Poppins under 16px that carries clinical meaning uses weight **500**.
- **Interactive height ≥ 44px** (`2.75rem`) for inputs, selects, tabs and Reset. #173 decision 3, pending the owner's visual check in Task 2.
- **The `ICL Size Calc` link** keeps its accessible name and `href={import.meta.env.BASE_URL}`. `NavBar.test.tsx` pins it.
- **The header element stays `<nav>`** (Ruling 1).
- **No third-party requests.** No CDN, and no font or script from another origin.
- **Commit trailer:** name the model actually used.
- **Use `gh ... --body-file`, never `--body`.** Open PRs; never merge. The owner reviews every PR.

### The standing verification command set

Unit gates may run in parallel with other worktrees. **Browser gates run under the machine-wide port lock** — every worktree serves on 4022.

```sh
npm run lint
npm run format:check
npx tsc --noEmit
npm test
echo $?

npm run build
bash e2e/setup.sh --subject-only
flock /tmp/icl-calc-port-4022.lock sh -c 'SUBJECT_ONLY=1 npm --prefix e2e run replay'
echo $?
flock /tmp/icl-calc-port-4022.lock docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.64.1-noble \
  npx playwright test --project=visual-assert
echo $?
```

To regenerate fixtures, add `--update-snapshots` to the docker command. Then **open every changed PNG** and read every aria hunk before committing; a sample is not enough. An aria fixture moving in a task that did not predict it is a stop, not a regeneration.

## Review Focus

Inputs and conditions the spec implies but does not test. Each is pinned by a test in the task named.

1. **A gauge value exactly on a band boundary, below the dataset minimum, or the form's initial `0`.** The accessible name must still name exactly one band, or say the value is outside the dataset range. It must never be blank or "undefined". → Task 10.
2. **A field with no error must not reference a missing message.** `aria-describedby` pointing at an absent id is announced as nothing, or as an error by some screen readers. → Task 4.
3. **A matrix column with zero matching eyes** (golden rows `07-small-lens-bin` and `08-large-lens-bin` empty a whole lens size). Every cell still reads `0`, at full ink, and the column still lines up. → Task 7.
4. **Applying a preset after the clinician has typed a name or date of birth.** The identity fields are untouched, and Reset still clears everything. → Task 13.
5. **A 390px viewport with the sticky matrix column.** The row label stays visible while nine numeric columns scroll, and the page itself does not scroll horizontally. → Task 7.

---

## File Structure

| file | responsibility | PR |
|---|---|---|
| `src/App.css` | tokens, base layer, patterns; the grid shim shrinks to **nothing** by PR 6 | 3a–6 |
| `src/contrast.test.ts` | **new**: asserts the token pairs' WCAG ratios from `App.css` | 3a |
| `e2e/contrast.spec.ts` | **new**: axe-core colour-contrast report, non-blocking | 3a |
| `e2e/playwright.config.ts` | adds the `contrast` project | 3a |
| `.github/workflows/main.yml` | **new job** `Contrast report (non-blocking)`; no existing job renamed | 3a |
| `src/patient/FieldWithUnit.tsx` | the measured row: label, control, unit, message | 4 |
| `src/patient/Info.tsx` | the identity row, on the same row pattern | 4 |
| `src/patient/{Biometry,CorneaProfile,SpectacleRefraction,ICLPower}.tsx` | field groups; accessible-name fixes #136 and #139 | 4 |
| `src/patient/index.tsx` | the three-column patient grid | 4 |
| `src/util.ts`, `src/util.test.ts` | **deleted** (`getClassName` leaves with Bootstrap's validation classes) | 4 |
| `src/matrix/index.tsx`, `src/matrix/components.tsx` | the ledger | 5 |
| `src/regression/{index,VaultPrediction,VaultProbability}.tsx` | the compact ledger | 5 |
| `src/normality/Gauge.tsx` | geometry-only `buildZones`, zone colours, #138 naming | 6 |
| `src/normality/Histogram.tsx` | Treeye tokens in place of Bootstrap's | 6 |
| `src/normality/index.tsx` | the chart grid | 6 |
| `src/golden/__snapshots__/replay.test.ts.snap` | 30 `"color": ""` deletions, nothing else | 6 |
| `src/presets.ts` | **new**: built-in example cases, **copied** from the golden rows | 7 |
| `src/patient/Presets.tsx` | **new**: the "Load an example case" control | 7 |

---

# PR 3a — Legibility tokens (#173)

Branch `style/173-legibility` from `treeye-reskin`. Title: `style: make every label legible at clinical distance (#173)`.

Fixtures expected to move: **all 14 screenshots** (colour, size, and control height). **No aria fixture.**

### Task 1: Assert the contrast of the token pairs in use

**Files:**
- Create: `src/contrast.test.ts`
- Modify: `src/App.css`

**Interfaces:**
- Produces: nothing imported elsewhere. The helper lives inside the test file, so coverage is unaffected.

- [ ] **Step 1: Write the failing test.** It reads `src/App.css` with `fs`, resolves the hex value of each custom property in the first `:root` block, and asserts:

```ts
const PAIRS: [role: string, fg: string, bg: string, min: number][] = [
  ['clinical value', '--ink', '--field', 7],
  ['unit, column and row label', '--ink', '--paper', 7],
  ['section heading, footer', '--muted', '--paper', 4.5],
  ['placeholder', '--muted', '--field', 4.5],
  ['input boundary', '--faint', '--field', 3],
  ['tool name on the header', '--violet', '--chrome', 7],
  ['validation message', '--leaf-crimson', '--paper', 4.5]
];
it.each(PAIRS)('%s: %s on %s is at least %d:1', (_, fg, bg, min) =>
  expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min));
```

And, separately, that the CSS actually *uses* those tokens for those roles. These are regex assertions against the rule bodies:
- `thead th` uses `color: var(--ink)`;
- `.input-group-text` uses `color: var(--ink)`;
- `h4` uses `color: var(--muted)`;
- `.site-footer` uses `color: var(--muted)`;
- `input::placeholder` uses `color: var(--muted)`;
- the base `input, select` rule's `border-bottom` uses `var(--faint)`.

The `contrast(a, b)` helper is WCAG 2.2 relative luminance. Spot-check it with `expect(contrast('#8e8598', '#ffffff')).toBeCloseTo(3.52, 2)`, the figure #173 measured.

- [ ] **Step 2: Run it.** `npx vitest run src/contrast.test.ts`. Expected: the ratio assertions pass, because the tokens already exist; every **role** assertion fails.

- [ ] **Step 3: Change `src/App.css`.**
  - **Colours:**
    - `h4` → `--muted`;
    - `thead th` and `.input-group-text` → `--ink`;
    - `.site-footer` → `--muted`;
    - add `input::placeholder { color: var(--muted); }`;
    - base `input, select` `border-bottom` → `1px solid var(--faint)`;
    - `input:disabled` keeps its dotted style but uses `--faint`.
  - **Sizes** (minimum `0.8rem`): `h4`, `thead th`, `.input-group-text` and `.invalid-feedback` go from 0.68–0.74rem to `0.8rem`.
  - **Weight:** `tbody th[scope='row']` goes from 300 to **500**, because those labels carry clinical meaning.
  - **Height:** `input`, `select`, `.tabs a` and `.btn-ghost` get `min-height: 2.75rem`, and `input, select` pad vertically to centre their text.

- [ ] **Step 4: Run it.** `npx vitest run src/contrast.test.ts`. Expected: PASS.

- [ ] **Step 5: Prove it.** Mutate each role assertion's target in `App.css` individually: put `--faint` back on `thead th`, `--rule` back on the input border, and so on. Each must go red, then green again once restored. Report the transcript.

- [ ] **Step 6: Commit.** `style: make every label legible at clinical distance (#173)`

### Task 2: Owner's visual check, then the fixtures

**Files:**
- Modify: `e2e/visual.spec.ts-snapshots/*.png`

- [ ] **Step 1: Screenshots for the owner, before regenerating anything.** Build. Then, under the port lock, take before and after full-page shots of all four routes at 1280px and 390px. Use `git stash` for "before", or the Cloudflare preview. Save them to `~/share/icl-calc-legibility/` as `{before,after}-{route}-{desktop,mobile}.png`.

  **Stop and report.** #173 decisions 1 and 3 (AAA labels, 44px controls) are conditional on this look.

- [ ] **Step 2: On sign-off, regenerate.** Run the docker command with `--update-snapshots`. Expected: 14 PNGs changed and **zero** aria files changed. Open every PNG.

- [ ] **Step 3: Run the full standing set.** Expected: all green, with L2 2/2.

- [ ] **Step 4: Commit.** `test: regenerate the visual baselines for the legibility tokens`

### Task 3: A non-blocking contrast report

**Files:**
- Create: `e2e/contrast.spec.ts`
- Modify: `e2e/playwright.config.ts`, `e2e/package.json`, `e2e/package-lock.json`, `.github/workflows/main.yml`, `e2e/README.md`

**Interfaces:**
- Produces: a Playwright project named `contrast`, and a CI job named exactly **`Contrast report (non-blocking)`**.

- [ ] **Step 1:** Add `@axe-core/playwright` to `e2e/` only. Its version must be compatible with `@playwright/test` 1.64.1.

- [ ] **Step 2: Write `e2e/contrast.spec.ts`.**
  - **What it does:** for each route, at both viewports, it runs `new AxeBuilder({ page }).withRules(['color-contrast']).analyze()`. It attaches the violations as JSON with `testInfo.attach`, and asserts `violations` is `[]`.
  - **Navigation:** it reaches routes with `gotoTab` from `e2e/lib/app.ts`.
  - **Where it fits:** it belongs to the new `contrast` project only, served on the existing subject `webServer`.

- [ ] **Step 3: Prove it can fail.** Temporarily set `h4 { color: var(--faint) }`, build, and run `flock /tmp/icl-calc-port-4022.lock npx --prefix e2e playwright test --project=contrast`. Expected: FAIL naming the `h4` nodes. Restore it; expected: PASS.

- [ ] **Step 4: The CI job.**
  - **Setup:** a new job, `contrast`, with display name `Contrast report (non-blocking)`, `needs: [test]` and `continue-on-error: true`. It uses the same build, setup and browser-install steps as `e2e-replay`, then runs `--project=contrast` and uploads the attachments as an artifact.
  - **What must not change:** no existing `name:` changes, and nothing is added to branch protection. State both in the PR body.
  - **Docs:** update `e2e/README.md`'s project table (six projects; three run in CI).

- [ ] **Step 5: Commit.** `ci: report colour contrast on every route, without blocking`

Then open the PR. Its body lists the fixture accounting and the owner's sign-off.

---

# PR 4 — The measured row (#136, #139)

Branch `feat/122-measured-row` from `treeye-reskin` after PR 3a has merged. Title: `feat: rebuild the patient form on the measured-row pattern (#136, #139)`.

Fixtures expected to move:
- `patient-{desktop,mobile}.png`;
- `patient.aria.yml`, about 40 lines (spec §2.4): `"@"` ×4 renamed, `Sphere`/`Cylindre`/`Axis` ×2 qualified, and every `- text: mm …` run-on line gone.

The other three aria fixtures do **not** move.

### Task 4: `FieldWithUnit` becomes the measured row

**Files:**
- Modify: `src/patient/FieldWithUnit.tsx`, `src/patient/FieldWithUnit.test.tsx`, `src/App.css`

**Interfaces:**
- Consumes: `UNITS` (already in the file).
- Produces:

```ts
interface FieldWithUnitProps {
  label: string;          // visible text
  name: string;           // Formik path; L2 addresses it - unchanged
  unit: Unit;
  srLabel?: string;       // replaces the accessible label text (axis rows: "Anterior Keratometry Flat axis")
  qualifier?: string;     // sr-only suffix appended to the label (#139: " (spectacle refraction)", " (ICL power)")
  axisOf?: boolean;       // renders the row as a continuation of the one above (no top rule, right-aligned "@")
  touched?: boolean; placeholder?: string; error?: string; value?: number; disabled?: boolean;
}
```

The accessible name is `${srLabel ?? label}${qualifier ?? ''}, ${UNITS.get(unit)}`. Two examples: `White to White (WtW), millimetres`, and `Anterior Keratometry Flat axis, degrees`.

- [ ] **Step 1: Write the failing tests** in `FieldWithUnit.test.tsx`. Replace the tests that pinned the old `title` span.

```tsx
it('names the control with its unit, and hides the visible unit from the tree', () => {
  renderField({ label: 'White to White (WtW)', name: 'biometry.wtw', unit: 'mm' });
  expect(screen.getByRole('spinbutton', { name: 'White to White (WtW), millimetres' })).toBeInTheDocument();
  expect(screen.getByText('mm')).toHaveAttribute('aria-hidden', 'true');
});
it('uses srLabel in place of a visible "@"', () => {
  renderField({ label: '@', srLabel: 'Anterior Keratometry Flat axis', name: 'corneaProfile.axisaf', unit: 'º', axisOf: true });
  expect(screen.getByRole('spinbutton', { name: 'Anterior Keratometry Flat axis, degrees' })).toBeInTheDocument();
  expect(screen.queryByRole('spinbutton', { name: /^@/ })).toBeNull();
});
it('appends the qualifier to the name only', () => {
  renderField({ label: 'Sphere', qualifier: ' (ICL power)', name: 'iclSphere', unit: 'dpt', disabled: true, value: -8.5 });
  expect(screen.getByRole('textbox', { name: 'Sphere (ICL power), dioptres' })).toBeDisabled();
  expect(screen.getByText('Sphere')).toBeVisible();
});
it('marks an invalid, touched field and points at its message', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm', error: 'Too small', touched: true });
  const input = screen.getByRole('spinbutton');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Too small');
});
it('references no message when there is no error', () => {           // Review Focus 2
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm' });
  const input = screen.getByRole('spinbutton');
  expect(input).not.toHaveAttribute('aria-describedby');
  expect(input).not.toHaveAttribute('aria-invalid');
});
it('keeps the name attribute L2 addresses', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm' });
  expect(screen.getByRole('spinbutton')).toHaveAttribute('name', 'biometry.ata');
});
```

- [ ] **Step 2: Run them.** `npx vitest run src/patient/FieldWithUnit.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **The row:** `<div className="mrow">` holding a `<label>`, the control and `<span className="unit" aria-hidden="true">`.
  - **The label:** contains the visible text (wrapped `aria-hidden` when `srLabel` is set), plus `<span className="sr-only">{srLabel}{qualifier}, {unitWord}</span>`.
  - **The id:** `id={name + 'field'}`, unchanged (#129).
  - **Validation:** the error is `<div id={`${name}-error`} className="mrow-error">`, rendered only when `error && touched`, together with `aria-invalid` and `aria-describedby`.
  - **CSS** (spec §5.2–5.4):
    - `.fieldgroup` uses `display:grid; grid-template-columns: minmax(0,1fr) 7.5rem 3.4rem`;
    - `.mrow` uses `display: contents`;
    - top rules, using `--rule`, are drawn on the row's children;
    - `.mrow.axis` drops the top rule;
    - `[aria-invalid='true']` gets a 2px `--leaf-crimson` underline;
    - `.unit` keeps PR 3a's `--ink` at `0.8rem`/500.

- [ ] **Step 4: Run them.** Expected: PASS.

- [ ] **Step 5: Prove each assertion can fail, individually.**
  - Drop `aria-hidden` from the unit.
  - Drop the qualifier from the sr-only span.
  - Always render `aria-describedby`.
  - Rename `id` to `name + 'input'`.

- [ ] **Step 6: Commit.** `feat: give every patient field its unit in its accessible name`

### Task 5: Groups, #136, #139, and the identity row

**Files:**
- Modify: `src/patient/{Biometry,CorneaProfile,SpectacleRefraction,ICLPower,Info}.tsx`, `src/patient/CorneaProfile.test.tsx`, `src/patient/Info.test.tsx`, `src/ICLContainer.test.tsx`
- Delete: `src/util.ts`, `src/util.test.ts`

**Interfaces:**
- Consumes: Task 4's `srLabel`, `qualifier` and `axisOf`.

- [ ] **Step 1: Make the tests better** (spec §8: by accessible name, not by position or id).
  - **`CorneaProfile.test.tsx`:** replace the positional `getAllByLabelText('@')` walk with the four names `Anterior Keratometry Flat axis, degrees`, `Anterior Keratometry Steep axis, degrees`, `Posterior Keratometry Flat axis, degrees` and `Posterior Keratometry Steep axis, degrees`. Keep the order assertion via `getAllByRole('spinbutton')`, compared against `getByRole('spinbutton', { name })` for all nine.
  - **`ICLContainer.test.tsx`:** wherever fields are pinned by `id` because labels were ambiguous, pin them by name instead:
    - `Sphere (spectacle refraction), dioptres`, `Cylindre (spectacle refraction), dioptres`, `Axis (spectacle refraction), degrees`;
    - `Sphere (ICL power), dioptres`, `Cylindre (ICL power), dioptres`, `Axis (ICL power), degrees`.
  - **`Info.test.tsx`:**
    - Age is `textbox` named `Age, years` and is disabled;
    - an invalid date of birth that has been touched gets `aria-invalid="true"`;
    - the `title="years"` assertion is removed, because that span is now `aria-hidden`.

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Groups:** each group renders `<section className="fieldgroup-section"><h4>…</h4><div className="fieldgroup">…</div></section>`.
  - **Axis rows (#136):** pass `axisOf` with `srLabel="<field> axis"`.
  - **Refraction and ICL power (#139):** SpectacleRefraction passes `qualifier=" (spectacle refraction)"` and ICLPower passes `qualifier=" (ICL power)"`, on Sphere, Cylindre and Axis only. Vertex and SE are unambiguous.
  - **Previous surgery select:** keeps `id="corneaProfile.previousSurgery"` and `name`, and is laid out as a row spanning the control and unit columns.
  - **`Info.tsx`:** the same row pattern in a four-cell horizontal group that stacks under `48rem`. The DOB error uses `aria-invalid` and `aria-describedby` like Task 4.
  - **`getClassName`:** remove its import everywhere, then delete `util.ts` and `util.test.ts`.

- [ ] **Step 4: Run the full suite.** `npm test`. Expected: PASS, and coverage at or above the floors. Removing `util.ts` removes covered lines; record the before and after figures in the PR body.

- [ ] **Step 5: Prove it.** Revert one `srLabel`, then one `qualifier`, individually. Each must turn the relevant test red.

- [ ] **Step 6: Commit.** `fix: name the four axis fields and disambiguate refraction from ICL power (#136, #139)`

### Task 6: The patient grid, the shim, and the fixtures

**Files:**
- Modify: `src/patient/index.tsx`, `src/App.css`, `e2e/visual.spec.ts-snapshots/patient*`

- [ ] **Step 1: Implement.**
  - **`patient/index.tsx`:** `<div className="patient-grid">` with three columns (Biometry | Cornea Profile | Refraction + ICL Power), using `grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: clamp(1.5rem, 4vw, 3rem)` and one column under `48rem`.
  - **The `<hr>` stays:** removing it would move a `separator`, which no PR predicts.
  - **Field order and grouping are unchanged** (spec §5.6).

- [ ] **Step 2: Move PR 3a's pin.** `src/contrast.test.ts` asserts `.input-group-text { color: var(--ink) }`. Re-point that role assertion to `.unit`, which Task 4 introduced, before deleting the old class. Then prove it: put `--faint` on `.unit` and see red.

- [ ] **Step 3: Delete shim blocks** that no longer have a user:
  - `.form-group`, `.section-form`, `.col-sm-6`, `.col-md-2`, `.col-md-3`, `.offset-md-1`;
  - `.input-group`, `.input-group-append .input-group-text`;
  - `.is-invalid`, `.invalid-feedback`.

  Verify with `grep -rhoE 'className="[^"]*"' src | tr ' "' '\n\n' | sort -u`: every class still used must still be defined. `.row`, `.form-row`, `.col-4` and `.col-md-{4,5,6}` stay for PRs 5 and 6.

- [ ] **Step 4: Run the standing set, then regenerate.** Expected:
  - `patient-{desktop,mobile}.png` and `patient.aria.yml` move;
  - the other aria fixtures are byte-identical;
  - L2 2/2.

  Read the aria diff hunk by hunk. Only the renames listed under PR 4's heading and the removed `- text:` unit lines may appear.

- [ ] **Step 5: Commit.** `feat: lay the patient form out on a three-column grid and retire its shim`

---

# PR 5 — The ledger

Branch `feat/122-ledger` after PR 4. Title: `feat: rebuild the result tables on the ledger pattern`.

Fixtures expected to move: `matrix-*` and `regression-*` (2 each). **No aria fixture**; the `<hr>` on Regression stays.

### Task 7: The matrix ledger

**Files:**
- Modify: `src/matrix/index.tsx`, `src/matrix/components.tsx`, `src/matrix/index.test.tsx`, `src/matrix/components.test.tsx`, `src/App.css`

**Interfaces:**
- Produces:
  - CSS classes `.ledger-scroll` (wrapper), `.ledger` (table), `.lens-small`, `.lens-medium` and `.lens-large`, put on each `LensHeaderCol` `<th>` by `LENS_SIZES` order;
  - `MatrixRow` and `DividerRow` keep their signatures.

- [ ] **Step 1: Write the failing tests.**

```tsx
it('wraps the one table in a horizontal scroll region', () => {
  renderMatrix(); // existing helper
  const table = screen.getByRole('table');
  expect(table).toHaveClass('ledger');
  expect(table.parentElement).toHaveClass('ledger-scroll');
});
it('marks each lens column group with its size accent', () => {
  renderMatrix();
  expect(screen.getByRole('columnheader', { name: '12.6 mm' })).toHaveClass('lens-small');
  expect(screen.getByRole('columnheader', { name: '13.2 mm' })).toHaveClass('lens-medium');
  expect(screen.getByRole('columnheader', { name: '13.7 mm' })).toHaveClass('lens-large');
});
it('renders an empty lens column as legible zeros', () => {   // Review Focus 3
  // golden row 08-large-lens-bin (ata 12.7, clr 200) empties every 12.6 mm column
  render(<Matrix ata={12.7} clr={200} />);
  const eyes = within(screen.getByRole('row', { name: /^Number of Eyes/ })).getAllByRole('cell');
  eyes.slice(0, 3).forEach((c) => {
    expect(c).toHaveTextContent(/^0$/);
    expect(c.className).toBe('');
  });
});
it('keeps the summary list L2 reads', () => {
  renderMatrix();
  expect(screen.getByTestId('matrix-summary').querySelectorAll('li')).toHaveLength(3);
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement** (spec §6.2, with the zero-cell change above).
  - **Structure:** `<div className="ledger-scroll">` with `overflow-x: auto`, containing `<table className="ledger">`. Drop `table table-bordered table-hover`.
  - **Sticky label column:** first column `th` is `position: sticky; left: 0; background: var(--paper)`.
  - **Lens accent:** a `box-shadow: inset 0 -3px 0 var(--lens-*)` on the spanning headers.
  - **`DividerRow`:** keeps its `<td colSpan>` and empty text; style it as a spacer with a hairline.
  - **Numerals:** `--prose` with `tabular-nums`.
  - **Column headers:** keep PR 3a's `thead th { color: var(--ink) }`, which `src/contrast.test.ts` pins. The ledger may restyle the headers but must not change that colour.
  - **Row hover:** `--wash`.
  - **Summary list:** `ul[data-testid="matrix-summary"]` keeps its three `li` elements and their text exactly; restyle it as an inline definition row.

- [ ] **Step 4: Run them.** Expected: PASS.

- [ ] **Step 5: Prove it.** Remove the wrapper, then shift the lens classes by one, then add a `zero` class, individually. Each must go red.

- [ ] **Step 6: Commit.** `feat: set the floating matrix as a ledger with a sticky label column`

### Task 8: The compact ledger, Regression's layout, and the fixtures

**Files:**
- Modify: `src/regression/{index,VaultPrediction,VaultProbability}.tsx`, `src/regression/index.test.tsx`, `src/App.css`

- [ ] **Step 1: Write the failing test.** Both regression tables have the class `ledger compact`. Each row header has `lens-small`, `lens-medium` or `lens-large` in order. Each row header's `textContent` is exactly the size label, so the accent dot adds no text.

- [ ] **Step 2: Run it.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **The accent dot:** a `::before` pseudo-element on `th.lens-*`. It is not an element, so L2's `textContent` is unchanged.
  - **Classes:** drop the `col-4` and `text-right` classes from the cells; right alignment comes from the base `th, td` rule.
  - **`regression/index.tsx`:** `.row`/`.col-md-6`/`.col-md-5` become `<section className="regression-block">` with `max-width: 40rem`. The `<hr />` stays.

- [ ] **Step 4: Delete shim blocks:**
  - `.col-4`, `.col-md-5`, `.col-md-6`, `.list-inline`, `.text-right`;
  - `.row`, but only if Normality no longer uses it. It does until PR 6, so `.row` stays.

  Re-run the class audit from Task 6, Step 2.

- [ ] **Step 5: Run the standing set, then regenerate.** Expected:
  - `matrix-*` and `regression-*` move;
  - all four aria fixtures are **byte-identical**;
  - L2 2/2.

  At 390px, confirm in the PNG that the label column stays visible and the page itself has no horizontal scroll (Review Focus 5).

- [ ] **Step 6: Commit.** `feat: set the regression tables as compact ledgers and retire their shim`

---

# PR 6 — The charts (#138)

Branch `feat/122-charts` after PR 5. Title: `feat: restyle the charts and name the gauge (#138)`.

Fixtures expected to move:
- `normality-*` (2);
- `normality.aria.yml`: 6 × `img "<name>"` added;
- `replay.test.ts.snap`: **30 deletions, nothing else.**

### Task 9: `buildZones` returns geometry only (spec §7.1)

**Files:**
- Modify: `src/normality/Gauge.tsx`, `src/normality/Gauge.test.tsx`, `src/golden/replay.test.ts` (comment only), `src/golden/__snapshots__/replay.test.ts.snap`

**Interfaces:**
- Produces:

```ts
export type Band = { readonly min: number; readonly max: number };
export const QUANTILES: readonly number[] = [0.025, 0.25, 0.75, 0.975, 1.0];
export const buildZones = ({ values, quantiles = QUANTILES }: { values: number[]; quantiles?: readonly number[] }): Band[];
```

- [ ] **Step 1: Change the two `Gauge.test.tsx` tests to geometry only.**
  - `builds default zones correctly` expects `[{min:1,max:1.675},{min:1.675,max:4},{min:4,max:6.25},{min:6.25,max:7},{min:7,max:7}]`.
  - `builds zones correctly` passes the same quantile **values** it passes today, as plain numbers without their `color` fields. It expects the same three `{min, max}` pairs it asserts today: `1–3.4000000000000004`, `3.4000000000000004–7`, `7–7`.

- [ ] **Step 2: Run them.** Expected: FAIL (`color` present).

- [ ] **Step 3: Implement.**
  - Delete the module-scope `getComputedStyle` calls and the `Quantile` type.
  - `buildZones` maps quantile numbers to `Band`s. Keep the sort-once behaviour and the `Math.min(...values)` first band.

- [ ] **Step 4: Update the snapshot.** `npx vitest run src/golden/replay.test.ts -u`. Then verify:

```sh
git diff --numstat src/golden/__snapshots__/replay.test.ts.snap     # expect: 0	30
git diff -U0 src/golden/__snapshots__/replay.test.ts.snap | grep '^[-+] ' | grep -v '"color": ""'   # expect: no output
```

  Any other line moving is a stop.

- [ ] **Step 5: Prove both tests can fail.** Change `0.25` to `0.3` in `QUANTILES`; each must go red, then restore.

- [ ] **Step 6: Commit.** `refactor: make buildZones return geometry, and leave colour to the view`

### Task 10: Zone colours and the gauge's accessible name (#138)

**Files:**
- Modify: `src/normality/Gauge.tsx`, `src/normality/Gauge.test.tsx`, `src/normality/index.tsx`, `src/normality/index.test.tsx`

**Interfaces:**
- Consumes: `Band` and `buildZones` from Task 9.
- Produces:

```ts
export const ZONE_COLOURS = ['var(--leaf-crimson)', 'var(--leaf-ember)', 'var(--leaf-jade)', 'var(--leaf-ember)', 'var(--leaf-crimson)'] as const;
export const describeBand = (value: number, bands: Band[]): string;
export const Gauge = ({ title, value, values }: { title: string; value: number; values: number[] }) => JSX.Element;
```

`describeBand` returns exactly one of these strings:
- `below the 2.5th percentile`
- `between the 2.5th and 25th percentiles`
- `between the 25th and 75th percentiles`
- `between the 75th and 97.5th percentiles`
- `above the 97.5th percentile`
- `outside the range of the dataset`

The bands are half-open `[min, max)`, except that the last band is closed. A value below `bands[0].min` or above the last `max` is outside the range.

- [ ] **Step 1: Write the failing tests** (Review Focus 1).

```ts
const B = buildZones({ values: [1, 2, 3, 4, 5, 6, 7] });
it.each([
  [B[0].min, 'below the 2.5th percentile'],
  [B[1].min, 'between the 2.5th and 25th percentiles'],   // exactly on a boundary
  [B[2].min, 'between the 25th and 75th percentiles'],
  [B[4].max, 'above the 97.5th percentile'],              // the closed upper end
  [0, 'outside the range of the dataset'],                // the form's initial value
  [B[4].max + 1, 'outside the range of the dataset']
])('describes %s as %s', (v, s) => expect(describeBand(v, B)).toBe(s));

it('is an image named by its metric, value and band', () => {
  render(<Gauge title="Angle to Angle - AtA (mm)" value={B[2].min} values={[1,2,3,4,5,6,7]} />);
  expect(screen.getByRole('img', { name: /^Angle to Angle - AtA \(mm\): \d+(\.\d+)?, between the 25th and 75th percentiles$/ }))
    .toHaveAttribute('data-testid', 'gauge');
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Name:** the container `div` keeps `data-testid="gauge"` and its margins, and gains `role="img"` and `aria-label={`${title}: ${value}, ${describeBand(value, bands)}`}`.
  - **Colours:** `Zone[]` is built by zipping `bands` with `ZONE_COLOURS`.
  - **What must not change:** nothing about `LinearGauge` geometry, and no new `<svg>`.
  - **`normality/index.tsx`:** pass `title` to `Gauge`.

- [ ] **Step 4: Run them.** Expected: PASS.

- [ ] **Step 5: Prove it.** Make the last band half-open, then swap two strings, then drop `role`, individually. Each must go red.

- [ ] **Step 6: Commit.** `fix: give each gauge a name stating its value and band (#138)`

### Task 11: Histogram tokens, the chart grid, and the shim reaches zero

**Files:**
- Modify: `src/normality/Histogram.tsx`, `src/normality/Histogram.test.tsx`, `src/normality/index.tsx`, `src/App.css`, `e2e/visual.spec.ts-snapshots/normality*`

- [ ] **Step 1: Write the failing test.** Every bar has `style.fill === 'var(--leaf-indigo)'`. Gridlines use `var(--rule)`. Axis label text uses `var(--muted)`. And `getComputedStyle` is not called during render: spy on it, then assert it was not called.

- [ ] **Step 2: Run it.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Histogram:** replace the two `getComputedStyle` reads and the hard-coded `#dee2e6`/`#495057` with `style={{ fill/stroke: 'var(--…)' }}` (spec §7: indigo bars, `--rule` grid, Poppins 500 title, `--prose` numerals).
  - **`normality/index.tsx`:** `.row`/`.col-md-4` become `<div className="chart-grid">`, three columns on desktop and one under `48rem`. The histogram measures its own width, so alignment holds.

- [ ] **Step 4: Delete the rest of the shim:**
  - `.row`, `.form-row`, `.col-md-4`;
  - the remaining utility classes;
  - the `:root { --secondary … --dark }` block;
  - the **entire** `TEMPORARY GRID SHIM` section header.

  The class audit from Task 6, Step 2 must show every used class defined, and `grep -n 'SHIM' src/App.css` must print nothing.

- [ ] **Step 5: Run the standing set, then regenerate.** Expected:
  - `normality-*` move;
  - `normality.aria.yml` gains exactly six `- img` lines (regexes for the value), and the other aria files are byte-identical;
  - L2 2/2, which proves the gauge pointer string is unchanged.

  Open both PNGs and check the bands are crimson, ember and jade, not transparent.

- [ ] **Step 6: Commit.** `feat: set the charts in Treeye tokens and remove the last of the grid shim`

---

# PR 7 — Built-in example cases (#65)

Branch `feat/65-example-cases` after PR 6. Title: `feat: let clinicians load a built-in example case (#65)`.

Fixtures expected to move: `patient-*` (2) and `patient.aria.yml` (one combobox). **Built-in only**: no `localStorage` and no URL encoding, both rejected in #65 on privacy grounds.

### Task 12: The presets, copied rather than imported

**Files:**
- Create: `src/presets.ts`, `src/presets.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Preset { id: string; label: string; values: Omit<ICLInputs, 'patient'> }
export const PRESETS: readonly Preset[];
```

Six presets, with values **copied by hand** from these golden rows. The labels below are drafts for the owner to approve:

| id | from row | label |
|---|---|---|
| `typical-myope` | `01-baseline` | Typical myope |
| `steep-cornea` | `02-posterior-k` | Steep cornea, posterior keratometry measured |
| `after-myopic-surgery` | `03-prior-myopia-rx` | After myopic refractive surgery |
| `after-hyperopic-surgery` | `04-prior-hyperopia-rx` | After hyperopic refractive surgery |
| `smaller-segment` | `07-small-lens-bin` | Smaller anterior segment |
| `larger-segment` | `08-large-lens-bin` | Larger anterior segment |

Rows 05 and 06 (the axis hinge) and 09 and 10 (schema bounds) are test instruments, not cases, and are excluded. The labels never name a lens size: that would read as a recommendation, which spec §6.3 rules out.

- [ ] **Step 1: Write the failing test.**
  - Every preset passes `ICLSchema.validate` (with any patient).
  - Ids are unique.
  - Each preset's `values` deep-equal the corresponding golden row's inputs. The **test** may import `src/golden/inputs.json`.
  - **`src/presets.ts` does not import from `src/golden/`.** Assert this by reading the file's text: `expect(src).not.toMatch(/golden/)`.

- [ ] **Step 2: Run it.** Expected: FAIL (no module).

- [ ] **Step 3: Implement `src/presets.ts`** as literal objects.

- [ ] **Step 4: Run it, then prove it.** Change one copied digit, and separately add an `import … from './golden/inputs.json'`. Each must go red.

- [ ] **Step 5: Commit.** `feat: define six built-in example cases, copied from the golden rows`

### Task 13: The control

**Files:**
- Create: `src/patient/Presets.tsx`, `src/patient/Presets.test.tsx`
- Modify: `src/patient/index.tsx`, `src/App.css`, `e2e/visual.spec.ts-snapshots/patient*`

**Interfaces:**
- Consumes: `PRESETS` from Task 12, and `useFormikContext<ICLInputs>()`.
- Produces: `export const Presets = () => JSX.Element`. It is a `<select>` named **`Load an example case`**, with a first option `Choose…` (value `''`), placed above the Information heading.

- [ ] **Step 1: Write the failing tests** (Review Focus 4).

```tsx
it('applies a preset to every clinical field and leaves identity alone', async () => {
  renderPatientWithFormik(); // existing ICLContainer helper or a Formik wrapper
  await user.type(screen.getByLabelText('Name'), 'Ana');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Load an example case' }), 'typical-myope');
  expect(screen.getByRole('spinbutton', { name: 'Angle to Angle (AtA), millimetres' })).toHaveValue(/* 01-baseline ata */);
  expect(screen.getByLabelText('Name')).toHaveValue('Ana');
});
it('is cleared by Reset like everything else', async () => {
  // apply typical-myope, click the button named 'Reset'
  expect(screen.getByRole('spinbutton', { name: 'Angle to Angle (AtA), millimetres' })).toHaveValue(0);
  expect(screen.getByRole('combobox', { name: 'Load an example case' })).toHaveValue('');
});
it('returns to "Choose…" after applying, so the same case can be re-applied', async () => {
  // apply typical-myope
  expect(screen.getByRole('combobox', { name: 'Load an example case' })).toHaveValue('');
});
```

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Applying a preset:** `onChange` → `setValues({ ...values, ...preset.values })`, with `patient` untouched. Then reset the select's own state to `''`.
  - **Styling:** a measured row without a unit.

- [ ] **Step 4: Run them.** Then the standing set, with L2 2/2 (L2 never touches the control). Then regenerate: `patient-*` and `patient.aria.yml` move. The only aria hunk allowed is the new `combobox "Load an example case"` and its options.

- [ ] **Step 5: Prove it.** Spread `patient` from the preset, then skip the select reset, individually. Each must go red.

- [ ] **Step 6: Commit.** `feat: let clinicians load a built-in example case (#65)`

---

## After PR 7

- **Re-seed the coverage floors** at the measured values. That is the owner's call, now that the reskin no longer deletes covered code.
- **Consider promoting** `Contrast report (non-blocking)` to a required check, once it has run clean across PRs 4–7.
- **The phase gate** (spec §14) is met, and the v2.0.0 merge to `main` can be prepared. That is the one commit whose body carries the breaking-change footer.
