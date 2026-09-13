# Treeye reskin phase 1 — PRs 1–3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the oracle harness measure values rather than class names, fix #137, then land the Treeye token system, both typefaces and the reskinned shell with Bootstrap removed.

**Architecture:** Three pull requests against `treeye-reskin`, in order. PR 1 repoints five presentational locators in the browser gates and adds two inert test hooks, so that from then on a red L2 means broken arithmetic. PR 2 is a two-character accessibility fix that ships alone. PR 3 replaces Bootstrap with a plain-CSS token system, a base element layer, a documented temporary grid shim, and the reskinned NavBar/TabLinks/Footer.

**Tech Stack:** React 19, Vite 8, Vitest 5, Playwright 1.62 (containerised), plain CSS custom properties. No CSS framework after PR 3.

**Spec:** `docs/superpowers/specs/2026-09-14-treeye-reskin-phase-1-design.md`

## Global Constraints

- **Never write the line-initial breaking-change footer token in any commit body.** It cuts a major from the start of any line, including prose describing the rule. Write "the breaking-change footer". Spec §12.
- **`src/data.csv` and `src/golden/expected.json` are never edited.** CI-enforced by `golden-master-guard`. Spec §9.
- **Never run L2 and `visual-assert` at the same time.** Both bind port 4022 with `reuseExistingServer: true`; the second silently validates the first's build and goes green. Spec §10.
- **Coverage floors fail CI at 98.96 / 98.11 / 99.39 / 99.13** and currently sit exactly on those numbers. Never lower one to go green. Spec §9.
- **`import.meta.env.BASE_URL` stays `/icl-calc/`**, in `vite.config.ts` `base`, in `test.env`, and rendered into the brand link. Spec §9.
- **The brand link's accessible name must remain exactly `ICL Size Calc`** pointing at `/icl-calc/` — `src/misc/NavBar.test.tsx` pins it, and it is the base-path guard.
- **Every new or changed test must be proven capable of failing**: break the thing it checks, see red, restore, see green, report both, mutating each assertion individually. Spec §10.
- **Check exit codes with a standalone `echo $?`, never through a pipe.** This shell is zsh; `${PIPESTATUS[0]}` is empty.
- **Run `npm install`/`npm ci` in the background and poll.** A foreground npm command that goes quiet is killed by a stall watchdog.
- **Use `gh ... --body-file`, never `--body` with markup.**
- Worktree per PR, branched from `treeye-reskin`. Never work in the primary checkout.

### The standing verification command set

Run from the repository root for every PR. `npm test` must be run before the browser gates, never alongside them.

```sh
npm run lint
npm run format:check
npx tsc --noEmit
npm test

npm run build
npm --prefix e2e ci --prefer-offline
bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
```

Visual assertion, separately and never concurrently with the above:

```sh
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
```

---

## File Structure

| file | responsibility | PR |
|---|---|---|
| `e2e/lib/app.ts` | the oracle's reader: drives the form, reads rendered values | 1 |
| `e2e/visual.spec.ts` | screenshot and aria fixtures | 1 |
| `e2e/README.md` | project table (also fixes the four-versus-five miscount) | 1 |
| `src/matrix/index.tsx` | adds one inert `data-testid` to the summary list | 1 |
| `src/normality/Gauge.tsx` | adds one inert `data-testid` to the gauge container | 1 |
| `src/regression/VaultPrediction.tsx` | `scope` fix | 2 |
| `src/regression/VaultProbability.tsx` | `scope` fix | 2 |
| `src/fonts/*.woff2` | three vendored subsets | 3 |
| `src/App.css` | the whole design system: tokens, reset, base layer, chrome, shim | 3 |
| `src/App.scss` | **deleted** | 3 |
| `src/index.tsx` | stylesheet import path | 3 |
| `src/misc/NavBar.tsx` | the chrome bar | 3 |
| `src/misc/TabLinks.tsx` | the tab strip | 3 |
| `src/misc/Footer.tsx` | the page footer | 3 |
| `src/ICLContainer.tsx` | `.container` → `.wrap`, `<hr>` removal | 3 |
| `package.json` | drops `bootstrap` and `sass` | 3 |

---

# PR 1 — Decouple the browser gates from Bootstrap

**Branch:** `test/122-decouple-browser-gates`
**Commit type:** `test:`

**Why first:** spec §2.2. Until this lands, "a red L2 means broken arithmetic" is false — five of the oracle's handles are presentational, and three of them are Bootstrap classes this phase deletes.

**The proof obligation, and why it is not "zero `src/` diff".** The design document says PR 1 touches no file under `src/`. Planning found that two of the five handles cannot be repointed without a hook: the matrix summary list and the gauge container have no stable role, name or structural position that survives the reskin. Two `data-testid` attributes are added instead.

That is still provable, and by a stronger test than diff inspection: **`data-testid` changes no pixel, no accessible name and no rendered text**, so the evidence that PR 1 changed nothing is

- L2 replay green,
- all 14 screenshots byte-identical,
- all 4 aria fixtures byte-identical,
- `npm test` green with coverage unmoved.

Spec §2.2 and §11.1 are corrected to match.

### Task 1: Repoint the five handles

**Files:**
- Modify: `e2e/lib/app.ts` — `gotoTab`, `tableRows` call sites, `readAll`
- Modify: `e2e/visual.spec.ts:~128` — the navbar locator
- Modify: `e2e/README.md` — the project-count sentence
- Modify: `src/matrix/index.tsx` — one attribute
- Modify: `src/normality/Gauge.tsx` — one attribute

**Interfaces:**
- Consumes: nothing.
- Produces: `data-testid="matrix-summary"` on the matrix summary `<ul>`, and `data-testid="gauge"` on the gauge container `<div>`. PR 5 and PR 6 must preserve both.

- [ ] **Step 1: Capture the baseline that PR 1 must not move**

Run the full standing set above plus the visual assertion, and record that all are green *before* any edit. This is the control.

```sh
git -C . status --porcelain          # expect empty
npm run build && bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
echo $?
```

- [ ] **Step 2: Repoint the tab assertion onto `aria-current`**

`gotoTab` asserts the Bootstrap `active` class. `NavLink` already emits `aria-current="page"`, and `src/misc/TabLinks.test.tsx` already asserts it — with a comment saying the class "is what the reskin will change".

In `e2e/lib/app.ts`, replace:

```ts
  // NavLink gets activeClassName="active" only once the route actually matches.
  await expect(link).toHaveClass(/\bactive\b/);
```

with:

```ts
  // NavLink sets aria-current="page" only once the route actually matches.
  // Asserted rather than the `active` class: the class is presentational and
  // #122 replaces it, where aria-current is the semantic the tab strip must
  // keep whatever it looks like. src/misc/TabLinks.test.tsx pins the same
  // attribute at the unit level.
  await expect(link).toHaveAttribute('aria-current', 'page');
```

- [ ] **Step 3: Add the matrix summary hook and repoint its locator**

In `src/matrix/index.tsx`, on the `<ul className="list-inline">`:

```jsx
    <ul className="list-inline" data-testid="matrix-summary">
```

In `e2e/lib/app.ts`, replace:

```ts
  const footer = await page
    .locator('ul.list-inline li')
```

with:

```ts
  // Addressed by test hook, not by `ul.list-inline`: that is a Bootstrap
  // class and #122 deletes it, at which point this read would silently
  // return [] and the capture would differ from expected.json for a
  // presentational reason. The list has no accessible name and no stable
  // position (the ledger pattern wraps the table in a scroll container),
  // so a hook is the honest handle.
  const footer = await page
    .locator('[data-testid="matrix-summary"] li')
```

- [ ] **Step 4: Add the gauge hook and repoint its locator**

In `src/normality/Gauge.tsx`, on the container `<div>` that already carries the inset margins:

```jsx
    <div
      data-testid="gauge"
      style={{
        marginLeft: `${PLOT_INSET_LEFT}px`,
        marginRight: `${PLOT_INSET_RIGHT}px`
      }}
      ref={container}
    />
```

In `e2e/lib/app.ts`, replace:

```ts
  const gauges = page.locator('div[style*="margin-left: 71px"]');
```

with:

```ts
  // Addressed by test hook, not by the container's inline pixel margin.
  // That margin is presentation - it exists to align the gauge with the
  // histogram above it - and keying the oracle to it means any restyle of
  // the charts fails L2 for a reason that has nothing to do with a
  // clinical value.
  //
  // NOTE for #122's chart work: what is read below IS part of the golden
  // master. The captured string encodes the pointer's `left` percentage
  // (real arithmetic), `Math.floor(pointer.width / 2)` and `zoneHeight`.
  // With the defaults those are 4 and 12, giving `top: 12px`. Changing the
  // band thickness or the pointer size therefore turns L2 red. The gauge
  // restyle is colour only.
  const gauges = page.locator('[data-testid="gauge"]');
```

- [ ] **Step 5: Repoint the visual spec's navbar locator**

`e2e/visual.spec.ts` locates `nav.navbar` two lines above a comment explaining that the tab strip is addressed by role so it survives Bootstrap's removal. The navbar is the only `<nav>` on the page, so its implicit role is unique.

Replace:

```ts
      await expect(page.locator('nav.navbar')).toHaveScreenshot(
```

with:

```ts
      // By role, not `.navbar`: that is a Bootstrap class #122 deletes.
      // The header is the only <nav> on any route, so the implicit
      // navigation role addresses it uniquely.
      await expect(page.getByRole('navigation')).toHaveScreenshot(
```

- [ ] **Step 6: Fix the README's project count**

`e2e/README.md` says "Four Playwright projects live here" above a table of five.

Replace `Four Playwright projects live here.` with `Five Playwright projects live here.`

- [ ] **Step 7: Prove each repointed locator can still fail**

This is the important step, and it is per-locator, not per-file. For each of the four locators, break the thing it addresses, confirm red, restore, confirm green. Record both outcomes.

```sh
# (a) tab assertion — temporarily make TabLinks render no aria-current
#     by passing `end={false}` … then:
SUBJECT_ONLY=1 npm --prefix e2e run replay     # expect FAIL in gotoTab
echo $?

# (b) matrix summary — temporarily rename the testid in src/matrix/index.tsx
SUBJECT_ONLY=1 npm --prefix e2e run replay     # expect FAIL: footer array mismatch
echo $?

# (c) gauge — temporarily rename the testid in src/normality/Gauge.tsx
SUBJECT_ONLY=1 npm --prefix e2e run replay     # expect FAIL: toHaveCount(6)
echo $?

# (d) navbar screenshot — temporarily remove the <nav> wrapper
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert   # expect FAIL: locator resolved to 0
```

Restore each after observing the failure. A locator that stays green while its target is broken is a locator that asserts nothing — this project has found eight of those.

- [ ] **Step 8: Verify the change is inert**

```sh
npm run lint && npm run format:check && npx tsc --noEmit && npm test
npm run build && bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
echo $?
```

Then, separately:

```sh
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
echo $?
git status --porcelain e2e/visual.spec.ts-snapshots/
```

**Expected: the last command prints nothing.** All 14 screenshots and all 4 aria fixtures are byte-identical. If any moved, `data-testid` reached the rendered output somehow — stop and find out why before proceeding.

- [ ] **Step 9: Commit**

```bash
git add e2e/lib/app.ts e2e/visual.spec.ts e2e/README.md \
        src/matrix/index.tsx src/normality/Gauge.tsx
git commit -F - <<'EOF'
test: address the browser gates by role and hook, not by Bootstrap class

#122's safety argument is that the reskin changes presentation only, so a
red L2 means broken arithmetic or wiring. That was not true: five of the
oracle's handles were presentational, and three were Bootstrap classes the
reskin deletes.

  ul.list-inline li                    the matrix summary, by framework class
  toHaveClass(/\bactive\b/)            the tab strip, by framework class
  div[style*="margin-left: 71px"]      the gauges, by inline pixel margin
  nav.navbar                           the shell screenshot, by framework class

The tab assertion moves to aria-current, which NavLink already emits and
TabLinks.test.tsx already pins. The navbar moves to its implicit role. The
other two have no stable role, name or position that survives the reskin, so
they get a data-testid each - the same handle, and the same reasoning, as the
one Histogram.tsx has carried since #51.

data-testid reaches neither the pixels nor the accessibility tree, so this
is inert by construction and the gates prove it: L2 green, and all 14
screenshots and 4 aria fixtures byte-identical.

Each repointed locator was individually proven capable of failing by
breaking its target and observing red.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
EOF
```

---

# PR 2 — Associate regression row labels with their own rows (#137)

**Branch:** `fix/137-regression-row-scope`
**Commit type:** `fix:`

Both regression tables mark their `<tbody>` row labels `scope="col"`, so every data cell associates with the wrong header axis. Verified in the working tree, not taken from the issue.

### Task 2: The two-character fix

**Files:**
- Modify: `src/regression/VaultPrediction.tsx` — the `<th>` inside the `<tbody>` map
- Modify: `src/regression/VaultProbability.tsx` — same
- Modify: `e2e/visual.spec.ts-snapshots/regression.aria.yml` — regenerated

**Interfaces:**
- Consumes: nothing.
- Produces: nothing structural. `scope` is not read by L2.

- [ ] **Step 1: Write the failing assertion first**

Add to `src/regression/index.test.tsx`:

```tsx
/*
 * #137. Both tables marked their tbody row labels scope="col", so a screen
 * reader associated every vault figure with the wrong header axis - the
 * lens size was announced as a column heading for the columns beside it
 * rather than as the row's own label. The DOM snapshots recorded the broken
 * attribute faithfully for years and asserted nothing about it.
 */
it('marks each lens-size cell as its row header, not a column header', () => {
  render(<Regression {...VALUES} />);

  const rowHeaders = screen.getAllByRole('rowheader');

  expect(rowHeaders.map((h) => h.textContent)).toEqual([
    '12.6 mm',
    '13.2 mm',
    '13.7 mm',
    '12.6 mm',
    '13.2 mm',
    '13.7 mm'
  ]);
});
```

`getAllByRole('rowheader')` is the point: a `<th scope="col">` inside a `<tbody>` row exposes role `columnheader`, so this query finds nothing until the fix lands.

- [ ] **Step 2: Run it and watch it fail**

```sh
npx vitest run src/regression/index.test.tsx
echo $?
```

Expected: FAIL — `Unable to find an accessible element with the role "rowheader"`.

- [ ] **Step 3: Apply the fix**

In both `src/regression/VaultPrediction.tsx` and `src/regression/VaultProbability.tsx`, inside the `LENS_SIZES.map(...)` body:

```jsx
            <th scope="row" className="col-4">
              {size.label}
            </th>
```

(Only `scope` changes. `className` is left alone; PR 5 removes it.)

- [ ] **Step 4: Run it and watch it pass**

```sh
npx vitest run src/regression/index.test.tsx
echo $?
```

Expected: PASS.

- [ ] **Step 5: Prove the test can fail for the right reason**

Revert one of the two files to `scope="col"`, re-run, confirm the expectation fails with three entries rather than six, then restore. A test that passes with only one table fixed asserts half of what it claims.

- [ ] **Step 6: Regenerate the one fixture this moves**

```sh
npm run build && bash e2e/setup.sh --subject-only
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert --update-snapshots
git status --porcelain e2e/visual.spec.ts-snapshots/
```

**Expected: only `regression.aria.yml` is listed.** Its diff should show `cell` becoming `rowheader` for the three lens sizes in each table and nothing else. Any screenshot moving means something changed visually, which this fix must not do — stop.

- [ ] **Step 7: Verify and commit**

```sh
npm run lint && npm run format:check && npx tsc --noEmit && npm test
SUBJECT_ONLY=1 npm --prefix e2e run replay
echo $?
```

```bash
git add src/regression/VaultPrediction.tsx src/regression/VaultProbability.tsx \
        src/regression/index.test.tsx e2e/visual.spec.ts-snapshots/regression.aria.yml
git commit -F - <<'EOF'
fix: associate regression row labels with their own rows (#137)

Both regression tables marked their tbody row labels scope="col", so each
vault figure associated with a column header rather than with the lens size
naming its row. A screen reader user got the wrong axis on every cell in
both tables.

Two characters in two files. The test asserts the rowheader role rather than
the attribute, which is what a user actually gets, and fails against either
file left unfixed.

Only regression.aria.yml moves: cell -> rowheader, six entries. No screenshot
moves, because nothing about this is visual.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
EOF
```

---

# PR 3 — Adopt the Treeye design system and drop Bootstrap

**Branch:** `feat/122-design-system-and-shell`
**Commit type:** `feat:`

Closes #117. Three tasks, three commits, one PR.

**A deviation from the spec, flagged rather than absorbed.** Spec §11.2 describes PR 3 as "tokens, the reset, the fonts and a base element layer … bare `input`, `select`, `button`, `table`, `th`, `td`". That is not sufficient. Bootstrap also supplies every *layout* primitive in use — `container`, `row`, `form-row`, `col-4`, `col-sm-6`, `col-md-{2,3,4,5,6}`, `offset-md-1` — and deleting it without replacing them collapses the Patient tab's three columns and the Normality tab's six-graph grid into a single stacked column.

The plan therefore adds a **temporary grid shim**: roughly forty lines implementing exactly the classes in use, each commented with the PR that deletes it, reaching zero by the end of PR 6. The alternative — rewriting every layout wrapper in PR 3 — makes PR 3 the whole reskin and defeats the sequencing.

### Task 3: Tokens, fonts, base layer, and Bootstrap's removal

**Files:**
- Create: `src/fonts/poppins-300-latin.woff2`, `src/fonts/poppins-500-latin.woff2`, `src/fonts/newsreader-400-latin.woff2`
- Create: `src/App.css`
- Delete: `src/App.scss`
- Modify: `src/index.tsx:1` — the import
- Modify: `package.json` — remove `bootstrap` and `sass`

**Interfaces:**
- Consumes: nothing.
- Produces: the token set in `:root` (`--violet --ink --muted --faint --rule --paper --wash --chrome --field`, twelve `--leaf-*`, `--display --prose --gutter --measure --spectrum`, `--lens-small|medium|large`), plus `.wrap`, `.sr-only`, `.chrome`, `.tabs`, `.btn-ghost`. Tasks 4 and 5 and PRs 4–6 consume these names.

- [ ] **Step 1: Vendor the three font subsets**

Downloaded from the live site so the bytes match what Treeye serves. Self-hosted because the site makes no third-party requests; do not add a font CDN.

```sh
mkdir -p src/fonts
for f in poppins-300-latin poppins-500-latin newsreader-400-latin; do
  curl -fsS -o "src/fonts/$f.woff2" "https://preview.treeye.pages.dev/fonts/$f.woff2"
done
ls -l src/fonts/
```

Expected sizes: 7844, 7740 and 22504 bytes respectively. They live under `src/` rather than `public/` so Vite fingerprints them and rewrites their URLs under `base: '/icl-calc/'` automatically — a `public/` path would need hand-built absolute URLs and break the sub-path deploy.

- [ ] **Step 2: Write `src/App.css`**

```css
/*
 * The Treeye design system, adopted for the calculator (#122).
 *
 * Tokens, both typefaces and the component patterns are read from the live
 * site at https://preview.treeye.pages.dev/ - not from treeye.science, which
 * is a placeholder (see #120's correction). Everything above the "additions"
 * block is verbatim from that stylesheet.
 *
 * Plain CSS, no framework: Bootstrap left in this commit and the Treeye
 * system is custom properties all the way down.
 */

/* --------------------------------------------------------------- fonts
 * Self-hosted latin subsets, byte-identical to what the site serves. The
 * site states it makes no third-party requests; matching that is deliberate,
 * so these must never become a CDN link.
 *
 * NOTE: both Poppins subsets were built with every OpenType feature
 * stripped and have PROPORTIONAL digits - `1` is less than half the width
 * of `6`, and font-variant-numeric: tabular-nums is inert on them. Every
 * numeral in this application is therefore set in Newsreader, whose subset
 * does carry tnum. See spec section 2.1.
 */
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('./fonts/poppins-300-latin.woff2') format('woff2');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('./fonts/poppins-500-latin.woff2') format('woff2');
}
@font-face {
  font-family: 'Newsreader';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/newsreader-400-latin.woff2') format('woff2');
}

/* -------------------------------------------------------------- tokens */
:root {
  --violet: #421655;
  --ink: #2a2230;
  --leaf-purple: #532284;
  --leaf-indigo: #51499e;
  --leaf-blue: #3a62a8;
  --leaf-teal: #0d8d9c;
  --leaf-jade: #328d65;
  --leaf-green: #659748;
  --leaf-lime: #83b04b;
  --leaf-yellow: #f5bf39;
  --leaf-orange: #e98834;
  --leaf-ember: #db7338;
  --leaf-red: #b02b3f;
  --leaf-crimson: #9d1842;

  --muted: #6a6072;
  --faint: #8e8598;
  --rule: #e8e3ec;
  --paper: #ffffff;
  --wash: #faf8fb;

  --display: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
  --prose: 'Newsreader', Georgia, 'Times New Roman', serif;

  --gutter: clamp(1.25rem, 5vw, 3rem);
  --measure: 68rem;

  --spectrum: linear-gradient(
    90deg,
    var(--leaf-purple), var(--leaf-indigo), var(--leaf-blue), var(--leaf-teal),
    var(--leaf-jade), var(--leaf-green), var(--leaf-lime), var(--leaf-yellow),
    var(--leaf-orange), var(--leaf-ember), var(--leaf-red), var(--leaf-crimson)
  );

  /* Additions this phase makes, and no others - see spec section 4.2. */
  --chrome: #f6f2f7;
  --field: #faf8fb;
  --lens-small: var(--leaf-indigo);
  --lens-medium: var(--leaf-teal);
  --lens-large: var(--leaf-jade);
}

/* --------------------------------------------------------------- reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--prose);
  font-size: 1rem;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--display);
  font-weight: 300;
  line-height: 1.2;
  color: var(--violet);
}

h4 {
  font-family: var(--display);
  font-weight: 500;
  font-size: 0.74rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
h4::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rule);
}

a {
  color: var(--violet);
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--violet);
  outline-offset: 2px;
}

hr {
  border: 0;
  border-top: 1px solid var(--rule);
  margin: 1.6rem 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.wrap {
  width: min(100% - var(--gutter) * 2, var(--measure));
  margin-inline: auto;
}

/* ------------------------------------------------------ base element layer
 * Bare controls, styled so that no route is unstyled between here and the
 * PR that gives its region a pattern. PR 4 replaces the form treatment and
 * PR 5 the table treatment; what stays here afterwards is the fallback for
 * anything not explicitly patterned.
 */
input,
select,
button,
textarea {
  font: inherit;
  color: inherit;
}

input,
select {
  font-family: var(--prose);
  font-variant-numeric: tabular-nums;
  background: var(--field);
  border: 0;
  border-bottom: 1px solid var(--rule);
  border-radius: 3px 3px 0 0;
  padding: 0.24rem 0.5rem;
  width: 100%;
}

select {
  font-family: var(--display);
  font-weight: 300;
}

input:focus-visible,
select:focus-visible {
  border-bottom-color: var(--violet);
}

input:disabled {
  background: transparent;
  border-bottom-style: dotted;
  color: var(--muted);
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  padding: 0.42rem 0.7rem;
  text-align: right;
  vertical-align: baseline;
}

thead th {
  font-family: var(--display);
  font-weight: 500;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  border-bottom: 1px solid var(--rule);
}

tbody th[scope='row'] {
  text-align: left;
  font-family: var(--display);
  font-weight: 300;
  font-size: 0.84rem;
  color: var(--ink);
}

tbody td {
  font-family: var(--prose);
  font-variant-numeric: tabular-nums;
}

.btn-ghost {
  font-family: var(--display);
  font-weight: 300;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  color: var(--violet);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 0.4em 1.1em;
  cursor: pointer;
  width: auto;
}
.btn-ghost:hover {
  border-color: var(--violet);
}

/* -------------------------------------------------------------- chrome
 * The header and the tab strip share one tinted band closed by the leaf
 * spectrum: `.section.tint` applied to the chrome rather than a new device.
 * The chrome block is the tool; the paper below it is the work.
 */
.chrome {
  background: var(--chrome);
  border-bottom: 2px solid transparent;
  border-image: var(--spectrum) 1;
}

.chrome-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.4rem;
  padding-block: 0.7rem;
}

.chrome .brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}
.chrome .brand svg {
  width: 1.6rem;
  height: 1.6rem;
  display: block;
}
.chrome .wordmark {
  font-family: var(--display);
  font-weight: 500;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--violet);
}
.chrome .toolname {
  font-family: var(--display);
  font-weight: 300;
  font-size: 0.94rem;
  color: var(--ink);
  text-decoration: none;
  padding-left: 0.7rem;
  border-left: 1px solid var(--rule);
}
.chrome .btn-ghost {
  margin-left: auto;
}

.tabs {
  display: flex;
  gap: clamp(0.7rem, 2.4vw, 1.6rem);
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-x: auto;
}
.tabs a {
  display: block;
  font-family: var(--display);
  font-weight: 300;
  font-size: 0.86rem;
  letter-spacing: 0.03em;
  color: var(--ink);
  text-decoration: none;
  padding: 0.7rem 0 0.6rem;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.tabs a[aria-current='page'] {
  color: var(--violet);
  font-weight: 500;
  border-bottom-color: currentColor;
}

/* -------------------------------------------------------------- footer */
.site-footer {
  border-top: 1px solid var(--rule);
  margin-top: clamp(2rem, 6vw, 3.5rem);
  padding-block: clamp(2rem, 5vw, 3rem);
  font-size: 0.88rem;
  color: var(--faint);
}
.site-footer .rule {
  height: 2px;
  border: 0;
  background: var(--spectrum);
  opacity: 0.9;
  margin: 0 0 1.6rem;
}
.site-footer ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}
.site-footer a {
  color: var(--muted);
  text-decoration: none;
  display: inline-block;
  padding-block: 0.3rem;
}
.site-footer a:hover {
  color: var(--violet);
}
.site-footer p {
  margin: 0 0 0.3rem;
  max-width: 62ch;
}

/* ------------------------------------------------------- Chrome spinners
 * Carried over from App.scss unchanged: number inputs are right-aligned
 * clinical values and the spin buttons overlap them.
 */
input[type='number'] {
  -moz-appearance: textfield;
}
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ======================================================================
 * TEMPORARY GRID SHIM
 *
 * Bootstrap supplied every layout primitive this application uses, not just
 * its controls. These rules reimplement exactly the classes in use so that
 * no route collapses between this commit and the PR that gives its region a
 * Treeye-native layout. Each block names the PR that deletes it. This
 * section must be EMPTY by the end of PR 6; if it is not, something was
 * skipped.
 *
 * Deliberately minimal: no breakpoint system, no gutters config, no
 * generated class set. Only what `grep -rho 'className="[^"]*"' src` finds.
 * ====================================================================== */

/* deleted by PR 4 (patient form) and PR 5 (tables) */
.row,
.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1.5rem;
}

/* deleted by PR 4 */
.form-group {
  margin-bottom: 1rem;
}
.section-form {
  margin-bottom: 2rem;
}

/* deleted by PR 4 (patient, cornea, refraction, power) and PR 6 (normality) */
.col-4 { flex: 0 0 auto; width: calc(33.333% - 1rem); }
.col-sm-6 { flex: 0 0 auto; width: calc(50% - 0.75rem); }
.col-md-2 { flex: 0 0 auto; width: calc(16.666% - 1.25rem); }
.col-md-3 { flex: 0 0 auto; width: calc(25% - 1.125rem); }
.col-md-4 { flex: 0 0 auto; width: calc(33.333% - 1rem); }
.col-md-5 { flex: 0 0 auto; width: calc(41.666% - 0.875rem); }
.col-md-6 { flex: 0 0 auto; width: calc(50% - 0.75rem); }
.offset-md-1 { margin-left: 8.333%; }

@media (max-width: 48rem) {
  .col-4,
  .col-sm-6,
  .col-md-2,
  .col-md-3,
  .col-md-4,
  .col-md-5,
  .col-md-6 {
    width: 100%;
  }
  .offset-md-1 {
    margin-left: 0;
  }
}

/* deleted by PR 4 — the unit suffix becomes part of the measured row */
.input-group {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}
.input-group-append .input-group-text {
  font-family: var(--display);
  font-weight: 500;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  color: var(--faint);
}

/* deleted by PR 4 — validation moves to the measured row's underline */
.is-invalid {
  border-bottom: 2px solid var(--leaf-crimson);
}
.invalid-feedback {
  font-family: var(--display);
  font-weight: 500;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  color: var(--leaf-crimson);
}

/*
 * `.table-bordered` and `.table-hover` are deliberately NOT defined. They
 * appear on four elements today and are inert here: the base table layer
 * above already carries the hairline treatment, and PR 5 removes the
 * attributes. An empty ruleset would only look like an oversight.
 */

/* deleted by PR 5 — the matrix summary becomes a definition row */
.list-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}

/* utility classes used inline; deleted alongside their components */
.text-right { text-align: right; }
.text-center { text-align: center; }
.d-inline-block { display: inline-block; }
.mb-0 { margin-bottom: 0; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.ml-3 { margin-left: 1rem; }
.mt-5 { margin-top: 3rem; }
.pl-0 { padding-left: 0; }
```

- [ ] **Step 3: Repoint the stylesheet import and delete the Sass file**

In `src/index.tsx` line 1:

```ts
import './App.css';
```

```sh
git rm src/App.scss
```

- [ ] **Step 4: Drop both dependencies**

```sh
npm uninstall bootstrap sass
```

Run this in the background and poll — a foreground npm command that goes quiet is killed by the stall watchdog. `sass` goes because `src/App.scss` was the only Sass file in the repository; confirm with `find src -name '*.scss' -o -name '*.sass'`, which must return nothing.

- [ ] **Step 5: Verify the build and the unit suite**

```sh
npm run lint && npm run format:check && npx tsc --noEmit && npm test
echo $?
npm run build
echo $?
```

Coverage is expected to be unchanged: no `src/` logic changed, only a stylesheet import path.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -F - <<'EOF'
feat: adopt the Treeye design system and drop Bootstrap

Tokens, both self-hosted typefaces and the base element layer, read off the
live site at preview.treeye.pages.dev rather than the treeye.science
placeholder.

Bootstrap 4 leaves, and sass with it - src/App.scss was the only Sass file
in the repository, and three of its fifty lines existed only to move a
validation icon Bootstrap put inside the field. #117 measured a 4->5
migration at 29 authored usages plus those three internal overrides, to
arrive somewhere this design then leaves.

Numerals are set in Newsreader throughout. That is not a preference: both
Poppins subsets the site serves were built with every OpenType feature
stripped and have proportional digits, so tabular-nums is inert on them and
a nine-column matrix cannot be made to align. Newsreader's subset keeps
tnum and is uniform.

Carries a deliberately temporary grid shim. Bootstrap supplied the layout
primitives as well as the controls, and deleting it without them collapses
the Patient tab's three columns into one. Every block names the PR that
deletes it; the section must be empty by the end of PR 6.

Closes #117.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
EOF
```

### Task 4: The shell

**Files:**
- Modify: `src/misc/NavBar.tsx` — full rewrite
- Modify: `src/misc/TabLinks.tsx` — classes only
- Modify: `src/misc/Footer.tsx` — classes and structure
- Modify: `src/ICLContainer.tsx` — `.container` → `.wrap`, drop the `<hr>`
- Modify: `src/misc/NavBar.test.tsx` — one added assertion

**Interfaces:**
- Consumes: `.wrap`, `.chrome`, `.chrome-bar`, `.tabs`, `.btn-ghost`, `.site-footer` from Task 3.
- Produces: a second link in the header, accessible name `Treeye`, `href="https://treeye.science/"`. The brand link named `ICL Size Calc` and pointing at `/icl-calc/` is unchanged and must stay.

- [ ] **Step 1: Rewrite `src/misc/NavBar.tsx`**

```jsx
/*
 * The Treeye mark links out to the group's site; the tool name links to the
 * calculator's own base path. Two links, deliberately: #122's owner decision
 * is that the calculator carries no cross-site nav while it is still served
 * from GitHub Pages (that arrives with #123), but it should still offer one
 * way back. The tool-name link is also the base-path guard - NavBar.test.tsx
 * pins its href to import.meta.env.BASE_URL, which is the only assertion in
 * the suite that would catch a base-path regression.
 */
const TreeyeMark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 25V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="16" cy="11" r="4.4" fill="currentColor" />
  </svg>
);

export const NavBar = ({ resetForm }: { resetForm: (a?: any) => void }) => (
  <header className="chrome">
    <div className="chrome-bar wrap">
      <a className="brand" href="https://treeye.science/">
        <TreeyeMark />
        <span className="wordmark">Treeye</span>
      </a>
      <a className="toolname" href={import.meta.env.BASE_URL}>
        ICL Size Calc
      </a>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          resetForm();
        }}
      >
        Reset
      </button>
    </div>
  </header>
);
```

Note `<header>` replaces `<nav>`. **That breaks PR 1's `getByRole('navigation')` locator in `e2e/visual.spec.ts`.** Change it in the same commit to `page.locator('header.chrome')` — and say so in the commit body, because a locator changing twice in three PRs needs its reason on the record.

- [ ] **Step 2: Add the assertion for the new link**

Append to `src/misc/NavBar.test.tsx`:

```tsx
/*
 * The mark is the only route back to the group's site while the calculator
 * is hosted apart from it (#122 owner decision; #123 moves it under the
 * Treeye origin and adds real cross-site nav).
 */
it('links the Treeye mark at the group site', () => {
  render(<NavBar resetForm={() => {}} />);

  expect(screen.getByRole('link', { name: 'Treeye' })).toHaveAttribute(
    'href',
    'https://treeye.science/'
  );
});
```

- [ ] **Step 3: Run both NavBar tests and prove the new one fails first**

```sh
npx vitest run src/misc/NavBar.test.tsx
echo $?
```

Then temporarily remove the `href` from the brand anchor and confirm the new test fails; restore. Separately confirm the pre-existing `ICL Size Calc` test still passes — if it does not, the base-path guard has been broken and that is a stop.

- [ ] **Step 4: Restyle `src/misc/TabLinks.tsx`**

Only the class names change; the four links, their order and their routes do not.

```jsx
export const TabLinks = () => (
  <ul className="tabs">
    {LINKS.map((link, index) => (
      <li key={index}>
        <NavLink end={true} to={link.to}>
          {link.label}
        </NavLink>
      </li>
    ))}
  </ul>
);
```

The `className` render-prop is gone: the active state is now `aria-current="page"`, which `NavLink` sets on its own and which `TabLinks.test.tsx` already asserts. The inline `style={{ marginBottom: '1rem' }}` goes with it.

- [ ] **Step 5: Restyle `src/misc/Footer.tsx`**

Replace the Bootstrap utility classes with the footer pattern. Keep every link, its text and its href exactly — `Footer.test.tsx` and the aria fixtures assert them.

```jsx
  <footer className="site-footer">
    <div className="wrap">
      <hr className="rule" />
      <ul>
```

and drop `className="p-3 p-md-5 mt-5 bg-light text-center text-sm-left"`, the inline `style`, `bd-footer-links pl-0 mb-3`, `d-inline-block`, `ml-3` and `mb-0` from the elements below.

- [ ] **Step 6: Move the page container and drop the separator**

In `src/ICLContainer.tsx`, `<div className="container">` becomes `<div className="wrap">`, and the `<hr />` between `<TabLinks />` and `<TabContent />` is deleted — the chrome band's spectrum rule now does that job, and the `<hr>` renders a `separator` entry in every aria fixture.

- [ ] **Step 7: Run the suite and the replay**

```sh
npm run lint && npm run format:check && npx tsc --noEmit && npm test
echo $?
npm run build && bash e2e/setup.sh --subject-only
SUBJECT_ONLY=1 npm --prefix e2e run replay
echo $?
```

**L2 must be green.** If it is not, something in the shell changed a value or broke the form wiring — stop and diagnose; do not regenerate anything.

- [ ] **Step 8: Commit**

```bash
git add src/misc/ src/ICLContainer.tsx e2e/visual.spec.ts
git commit -F - <<'EOF'
feat: reskin the shell to the Treeye chrome

The header and the tab strip share one tinted band closed by the leaf
spectrum - `.section.tint` applied to the chrome rather than a new device.
The chrome block is the tool; the paper below it is the work.

Two links in the header. The Treeye mark goes to the group's site, which is
the only route back while the calculator is hosted apart from it; the tool
name keeps import.meta.env.BASE_URL, because NavBar.test.tsx pins that href
and it is the suite's only base-path guard. No cross-site nav yet - that is
#123's, once the tool is actually served from the same origin.

The tab strip drops its active class for aria-current, which NavLink already
sets and TabLinks.test.tsx already asserts.

The <hr> between the tabs and the content goes: the chrome's own rule does
that job, and the element rendered a `separator` entry in all four aria
fixtures.

The shell screenshot locator moves from getByRole('navigation') to
header.chrome. It moved to the role in the previous PR to escape Bootstrap's
`nav.navbar`; the element is now a <header>, so the role no longer matches.
Second move, same reason both times: the locator follows the semantics.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
EOF
```

### Task 5: Regenerate and review the fixtures

**Files:**
- Modify: all 14 PNGs in `e2e/visual.spec.ts-snapshots/`
- Modify: all 4 `*.aria.yml` in the same directory

- [ ] **Step 1: Assert first, to see the diffs before accepting them**

Deliberately run the assertion, not the update, so Playwright writes the expected/actual/diff triples.

```sh
npm run build && bash e2e/setup.sh --subject-only
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert
ls e2e/test-results/
```

- [ ] **Step 2: Review the aria diffs hunk by hunk before regenerating**

The **only** aria changes this PR may produce are:

1. `- separator` entries disappearing (the `<hr>` removals).
2. One new `link "Treeye"` with `/url: https://treeye.science/` in every route's header.

**Anything else is a bug in this PR, not a fixture to update.** In particular the form field names, the table cell contents and the footer links must be untouched. If a `spinbutton` or `cell` entry moved, stop.

- [ ] **Step 3: Regenerate**

```sh
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert --update-snapshots
echo $?
git status --porcelain e2e/visual.spec.ts-snapshots/
```

Expect 18 modified files: 14 PNGs and 4 YAMLs.

- [ ] **Step 4: Keep the before-shots retrievable for the PR description**

```sh
git show 468c433:e2e/visual.spec.ts-snapshots/patient-desktop-visual-assert-linux.png > /tmp/before-patient.png
```

- [ ] **Step 5: Commit**

```bash
git add e2e/visual.spec.ts-snapshots/
git commit -F - <<'EOF'
test: regenerate the visual baselines for the Treeye chrome

All 14 screenshots, because this is the deliberate visual change.

The aria fixtures move in exactly two ways, both reviewed hunk by hunk: the
`separator` entries go with the <hr> elements that produced them, and each
route gains the header's `Treeye` link. No field name, table cell or footer
link moved, which is what says the shell was restyled rather than
rearranged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01X71fYrkATTNbKWjUfMmHZi
EOF
```

---

## After PR 3

PRs 4–7 (the measured row, the ledger, the charts, presets) get their own plan, written once the base layer has been reviewed on the preview. Their markup depends on how the token layer actually looks in the container, and specifying it before that is guesswork.

Two things carried forward, both discovered while planning:

1. **The gauge restyle is colour only.** The captured pointer style encodes `Math.floor(pointer.width / 2)` and `zoneHeight`; with the defaults those give `left: calc(X% - 2px); top: 12px`. Changing the band thickness or pointer size turns L2 red against a frozen fixture.
2. **The grid shim must reach zero by the end of PR 6.** Each block in `src/App.css` names the PR that deletes it. A shim block still present after PR 6 means a region kept a Bootstrap-shaped layout.
