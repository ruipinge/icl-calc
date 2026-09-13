# Treeye reskin phase 1 — the visual revamp: design

**Date:** 14 September 2026
**Status:** proposed
**Issue:** #122 (phase 1 of epic #120). Depends on #121. Blocks #123. Subsumes #117.
**Companions:**
`docs/superpowers/specs/2026-09-11-treeye-reskin-phase-0-design.md` (the snapshot
strategy and visual coverage this phase spends),
`docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
(§6.3 versioning, §7.3 the golden-master stop rule)

---

## 1. What this is

A design for making the calculator a page of the Treeye site rather than a tool
that resembles it — adopting the token set, both self-hosted typefaces and the
existing component patterns, dropping Bootstrap, and inventing the two patterns
the brand has no precedent for.

**This phase cuts v2.0.0.** Spec §6.3 has reserved the major for exactly this and
nothing else: the version tracks what a clinician sees, and this is the change
they see.

It changes no computed clinical value. That claim is the phase's whole safety
argument, and §2.2 below explains why it is not yet checkable and what has to
happen first.

---

## 2. What is actually true today

Four statements in #120, #121 and #122 are contradicted by measurement. Two of
them change what this phase can safely do. Every figure below was taken from the
working tree, the font files the site actually serves, or the oracle fixtures.

### 2.1 Poppins cannot set the numbers

#122 says legibility at small sizes matters more here than on the brochure site
and that "Poppins 300 is the body weight, and 500 is available for labels and
emphasis". That reads as an instruction to set the calculator's numerals in
Poppins. The served font files refuse it.

Downloading the three files from `preview.treeye.pages.dev/fonts/` and
inspecting them:

| file | OpenType features | digit advances |
|---|---|---|
| `poppins-300-latin.woff2` | **none at all** | 292–629 / 1000 — proportional |
| `poppins-500-latin.woff2` | **none at all** | 350–647 / 1000 — proportional |
| `newsreader-400-latin.woff2` | `kern liga mark mkmk pnum tnum` | 1133 / 2000 — uniform |

Both Poppins subsets were built with every OpenType feature stripped, so
`font-variant-numeric: tabular-nums` is **inert** on them — there is no `tnum`
table to activate. And the digits are dramatically unequal: `1` is less than half
the width of `6`. Measured in a browser at 20px, `1111111111` sets 58.4px wide
against 125.8px for `6666666666`.

A nine-column numeric matrix set in Poppins jitters, and no CSS can fix it.
Newsreader's subset keeps `tnum` and is already uniform at every digit.

**Therefore: the serif sets every numeral** — table cells, input values, axis
labels — and Poppins sets labels, headings, nav and micro-caps. This inverts the
obvious assignment and is the spine of both patterns in §5 and §6.

This is also not a licence to add a fourth font file. The site states it makes no
third-party requests, and self-hosting three subsets is a deliberate property of
it. Three files in, three files out.

### 2.2 The L2 harness is coupled to Bootstrap and to inline pixel styles

#122's constraint reads: "A reskin changes presentation only — **if L2 goes red,
the reskin broke arithmetic or wiring.**" That is the invariant the whole phase
leans on, and it is not true today.

`e2e/lib/app.ts` reaches the oracle through five presentational handles:

| line | handle | what breaks it |
|---|---|---|
| `readAll` | `page.locator('ul.list-inline li')` | **a Bootstrap class.** Dropping Bootstrap makes the matrix footer read `[]` |
| `gotoTab` | `await expect(link).toHaveClass(/\bactive\b/)` | restyling tabs to Treeye's `a[aria-current="page"]` idiom breaks every tab switch |
| `readAll` | `div[style*="margin-left: 71px"]`, `toHaveCount(6)` | the gauge container's inline pixel margin |
| `tableRows` | `page.locator('table').nth(n)`, every `th,td` textContent | tables must stay `<table>` with the same cell sequence, including `DividerRow`'s empty cells |
| `readAll` | `input[name=…].inputValue()` | the four ICL Power outputs must stay `<input>`, not `<output>` |

`e2e/visual.spec.ts` carries the same problem in its own file: it locates
`nav.navbar` two lines above a comment explaining that the tab strip is addressed
by role "so the locator survives #122 dropping Bootstrap".

So a purely presentational change turns L2 red today, and "L2 is red" would mean
"something moved" rather than "arithmetic moved". The invariant has to be built
before it can be relied on. That is PR 1 in §11, and it comes before any design
work.

### 2.3 The golden-master data snapshot can move, legitimately

#120's correction comment states, of `src/golden/__snapshots__/replay.test.ts.snap`:

> plain JS objects, no presentation […] It contains nothing a reskin can move and
> must not be touched by phase 0 or phase 1.

The first clause is wrong, and the rest follows from it. The file contains **30
`"color": ""` entries**:

```
$ grep -c 'color' src/golden/__snapshots__/replay.test.ts.snap
30
```

They come from `Zone.color` (`src/normality/linear-gauge/index.ts`), which
`buildZones` populates from `Gauge.tsx`'s module-scope

```ts
getComputedStyle(document.body).getPropertyValue('--danger')   // and --warning, --success
```

— Bootstrap's theme variables. Under jsdom no stylesheet is applied, so they
resolve to the empty string, and the snapshot records the empty string thirty
times. It is presentation, it is in the file, and it is Bootstrap's.

Two further facts, both verified, change how much this matters:

- **It is not covered by `golden-master-guard`.** That job guards exactly
  `src/golden/expected.json` and `src/data.csv` (`.github/workflows/main.yml`).
  A change here fails as a unit-test snapshot mismatch, not as a stop-rule
  violation.
- **Zone colours never reach `expected.json`.** L2 captures the gauge *pointer's*
  inline style, not the zones. So this is a unit-test concern only.

§7 records the decision taken.

### 2.4 The aria fixtures will move substantially, and should

#121's gate describes aria snapshots as "stable across restyling — so they
survive the reskin". #122 inherits that expectation. It does not survive contact
with the four accessibility fixes this phase carries:

- **#136** renames four controls (`spinbutton "@"` ×4).
- **#139** renames six (`Sphere`/`Cylindre`/`Axis`, twice each).
- **#138** adds a subtree that does not exist today.
- The unit suffixes currently leak into the tree as bare text nodes that merge
  with the *next* field's label — `patient.aria.yml` line 30 reads
  `- text: mm White to White (WtW)` — and every one of those lines changes when
  the Bootstrap `.input-group-text` span goes.

That is roughly 40 of `patient.aria.yml`'s 121 lines. All of it is justified, and
naming it here is cheaper than defending it hunk by hunk during review.

The expectation that *survives* is the useful half: an aria fixture moving in a
PR that was not supposed to touch structure is still a real signal. §10 states
the obligation per PR.

### 2.5 Minor: `e2e/README.md` miscounts its own table

It says "Four Playwright projects live here" and then lists five (`capture`,
`replay`, `visual-assert`, `visual`, `smoke`). Fixed in passing in PR 1.

---

## 3. Decisions taken

Recorded here so they are made once. All five were put to the owner on
13–14 September 2026.

| # | decision | answer |
|---|---|---|
| 1 | Migrate to Bootstrap 5, or drop Bootstrap? | **Drop entirely.** Closes #117. |
| 2 | Does the calculator carry the Treeye site nav while on GitHub Pages? | **No** — calculator-only header. Cross-site nav arrives with #123. |
| 3 | Header treatment | **Tinted chrome band** (§4.3). |
| 4 | Carry the four open accessibility defects? | **All four**, with #137 shipped first and alone. |
| 5 | §2.3: hold the snapshot at a zero-line diff, or refactor cleanly? | **Refactor cleanly** (§7). |

### 3.1 Why dropping Bootstrap is right, not merely cheaper

#117 measured a Bootstrap 4→5 migration at 29 authored usages of renamed or
deleted classes, plus `src/App.scss` overriding three Bootstrap 4 internals
(`$input-height-inner`, `$input-padding-x`, `$input-height-inner-quarter`) to move
the validation icon on right-aligned numeric inputs.

Migrating pays that cost to arrive somewhere this design then leaves. Measured
from the working tree, the surface being dropped is small and almost entirely
layout primitives:

```
$ grep -rho 'className="[^"]*"' src --include='*.tsx' | … | sort -u | wc -l
49          # distinct authored class tokens
$ grep -rho 'className' src --include='*.tsx' | wc -l
81          # className sites across 17 files
```

Of the 49, the great majority are `col-*` / `row` / `form-*` / `table*` — grid and
control primitives that a token system replaces with about half as many authored
classes. `src/App.scss` is 50 lines, of which three rules exist only to fight
Bootstrap.

Two dependencies leave `package.json`: `bootstrap`, and `sass` — the latter
because `src/App.scss` is the only Sass file in the repository
(`find src -name '*.scss'` returns one path, imported once from
`src/index.tsx`). It becomes `src/App.css`.

### 3.2 Why the header carries no cross-site nav yet

The Treeye nav points at `/offer`, `/tools`, `/publications`, `/team`,
`/escrs-2026` — paths that exist only on the Treeye origin. From
`ruipinge.github.io/icl-calc/` they would have to be absolute links to
`treeye.science`, which works but sends a clinician off-origin mid-calculation.

The header instead carries the Treeye mark and wordmark, linking to
`treeye.science` — one way back, no five-link exit row. The nav arrives in #123
when the tool is actually served from the same origin, which is the point at
which those links stop being a redirect out.

---

## 4. The design system, as extended

### 4.1 What is adopted unchanged

Read off `https://preview.treeye.pages.dev/` (the real site;
`treeye.science` is a placeholder, per #120's correction). The whole token block
is adopted verbatim: `--violet --ink --muted --faint --rule --paper --wash`, the
twelve leaf colours, `--display --prose --gutter --measure --spectrum`, and the
`.sr-only`, `.wrap`, `.section`/`.section.tint`, `.section-label`, `.chip`,
`.btn`/`.btn-ghost` and footer patterns.

Two rules are inherited from the site's own stylesheet commentary and are treated
as binding:

- **A leaf colour never sits behind text at full strength.** The site's one
  exception is `.tag.live`, which uses a 12% tint under a separately darkened
  text colour (`#24694a`, not `--leaf-jade`).
- **Contrast is checked, not assumed.** The site's own comment records ember at
  3.2:1 and orange at 2.6:1 on white, both under AA, and chooses crimson instead.

Recomputing the whole palette against `--paper` reproduces those two figures
exactly (3.22 and 2.61), which validates the method. Only five leaf colours clear
AA 4.5:1 as text on paper:

| band | leaf colours, contrast against `--paper` |
|---|---|
| **passes AA as text (≥4.5:1)** | purple 10.88 · crimson 7.95 · indigo 7.51 · red 6.44 · blue 6.01 |
| **large text / non-text only (≥3:1)** | jade 4.09 · teal 3.96 · green 3.46 · ember 3.22 |
| **decorative only (<3:1)** | orange 2.61 · lime 2.54 · yellow 1.69 |

Every use of a leaf colour in §5–§7 is placed in the right row of that table.

### 4.2 What this phase adds

Five tokens, and no more:

```css
--chrome: #f6f2f7;               /* header/tab band — a violet-biased wash */
--field:  #faf8fb;               /* an input's fillable ground            */
--lens-small:  var(--leaf-indigo);
--lens-medium: var(--leaf-teal);
--lens-large:  var(--leaf-jade);
```

`--field` is deliberately `--wash`'s value under a separate name: the two mean
different things (a band versus a control) and will diverge if the form is ever
tuned, and aliasing them now costs nothing.

### 4.3 The chrome

The header and the tab strip sit together on `--chrome`, closed by a 2px
`--spectrum` rule; page content sits on `--paper` below. The chrome block is the
tool, the paper below it is the work.

This is `.section.tint` applied to the chrome rather than a new device: the site
already pairs a wash ground with a rule, and already runs `--spectrum` as a 2px
hairline under the hero and above the footer. A solid violet bar was considered
and rejected — the site has no filled dark bar anywhere, so it reads as a
different site rather than as the same site in tool mode.

Tabs use `aria-current="page"` for the active state, matching `.site-nav`. Note
that this is one of the five couplings in §2.2 and must not land before PR 1.

---

## 5. Pattern one: the measured row

### 5.1 Where it comes from

The site has no form. It does have `.list-plain`: label left, value right, hairline
between rows, values in a column. That is structurally the same object as a
`FieldWithUnit` row. The form is therefore not invented — it is `.list-plain`
with the value slot made editable.

### 5.2 Structure

Each group is one CSS grid; each row is `display: contents`, so labels, inputs and
units align across the whole group rather than per row:

```css
.fieldgroup { display: grid; grid-template-columns: minmax(0,1fr) 7.5rem 3.4rem; }
.mrow       { display: contents; }
.mrow > *   { border-top: 1px solid var(--rule); }
```

The group legend uses `.section-label`'s typography and its trailing hairline —
reuse, not reinvention.

### 5.3 The control

No box. The input takes a `--field` ground and a single hairline underline;
focus thickens that underline to `--violet` alongside the standard
`outline: 2px solid var(--violet); outline-offset: 2px`. Values are right-aligned,
set in `--prose` with `font-variant-numeric: tabular-nums` per §2.1. Disabled
computed outputs lose the ground and take a dotted underline, and stay real
`<input>` elements because L2 reads them with `.inputValue()`.

### 5.4 Validation, and the three overrides that disappear

Bootstrap renders a validation icon *inside* the field, which is the sole reason
`App.scss` reaches into `$input-height-inner`, `$input-padding-x` and
`$input-height-inner-quarter`.

This design drops the in-field icon. An invalid control turns its underline
`--leaf-crimson` at 2px — the one attention colour on this palette clearing AA at
7.95:1, and the colour the site itself chose for the same reason — and the message
renders below the row in Poppins 500 micro-caps, associated by `aria-describedby`
with `aria-invalid="true"` on the control. Colour is never the only signal; the
message is text.

The three overrides are deleted with the icon that caused them.

### 5.5 What the row does for the accessibility tree

Three of the four open defects are fixed by the pattern rather than patched
around it.

**#136 — four axis fields named `"@"`.** The axis row drops its top rule and
right-aligns the `@`, reading as a continuation of the keratometry value it
qualifies rather than as a peer row. The visible `@` is `aria-hidden`; the label
carries a `.sr-only` name:

```jsx
<label htmlFor={id}>
  <span aria-hidden="true">@</span>
  <span className="sr-only">Anterior Keratometry Flat axis, degrees</span>
</label>
```

**#139 — `Sphere`/`Cylindre`/`Axis` duplicated.** A `.sr-only` qualifier
disambiguates without changing a pixel: `Sphere<span class="sr-only"> (ICL
power)</span>`.

**The leaked units.** Today the unit sits in a `.input-group-text` span that the
accessibility tree serialises as a bare text node, merging with the next field's
label (§2.4). The unit span becomes `aria-hidden="true"` and the unit's full word
— already present in `FieldWithUnit`'s `UNITS` map — joins the accessible name.
`White to White (WtW)` becomes `White to White (WtW), millimetres`, and the
run-on text nodes disappear.

**#129 must not regress.** `FieldWithUnit`'s `htmlFor`/`id` pairing is load
bearing as of #130. The rewrite keeps ids explicit and stable.

### 5.6 What does not change

Field order, grouping, which tab a field is on, and what sits beside what, per
#122's "restyle the controls, keep the arrangement". The structural half is
machine-checked: #121's tests assert rendered text and roles, so reordering a
field fails a test while restyling one does not.

---

## 6. Pattern two: the ledger

### 6.1 Where it comes from

Bootstrap's `table-bordered` draws a box around every cell. The Treeye system
boxes nothing — it separates with hairlines and space (`.list-plain`, `.pubs`,
`.section-label::after`). The ledger is that applied to a data table: no cell
grid, ruled only where a rule carries meaning.

### 6.2 Decisions, each with its reason

**The lens accent.** The three lens sizes carry `--lens-small` (indigo),
`--lens-medium` (teal) and `--lens-large` (jade) as a 3px rule under each spanning
column-group header — `.card::before`'s device applied to a column group. The
three walk the canopy in order, so the colour encodes lens size rather than
decorating it. All three clear 3:1 against paper as non-text marks (§4.1); none
is asked to carry text.

**Zero cells.** Rendered in `--rule`, so a sparse column reads as sparse at a
glance. The text stays exactly `"0"` — L2 compares `textContent`, and this changes
only `color`.

**The row-label column is `position: sticky; left: 0`** on a `--paper` ground,
inside an `overflow-x: auto` wrapper. Nine numeric columns plus a long row label
cannot fit 390px, and this is what makes the matrix usable there instead of
unreadable. It is the one genuinely new responsive behaviour in the phase, and it
is a deliberate arrangement change under #122's "make it deliberately, say so".

**`DividerRow` survives** as a real row with a real `<td colSpan={10}>`, because
the oracle counts cells. It becomes a band of space with a hairline instead of a
bordered empty strip. Its `textContent` stays `""`.

**Numerals** are `--prose` with `tabular-nums`; row labels and column heads are
Poppins (300 and 500 micro-caps respectively).

**Hover** keeps `--wash`, replacing `table-hover`.

### 6.3 The two regression tables

Three rows need neither a sticky column nor a spanning header, so a `compact`
variant drops both and moves the lens accent to a dot beside the row label.

**#137** is fixed here if it has not already shipped: `scope="col"` → `scope="row"`
on the `<th>` inside each `<tbody>` row, in `VaultPrediction.tsx` and
`VaultProbability.tsx`. Verified from the working tree, not from the issue text.

**What is deliberately absent:** no bar, no highlight on the best row, no traffic
light. Choosing a lens is the clinician's call and the tool has never made it;
adding a visual recommendation would be a clinical change wearing a restyle's
clothes.

### 6.4 Decimal alignment, and why the fix is alignment and not formatting

`round(val, 2)` returns a number, so `2.59`, `2.33` and `2` render with different
decimal counts — that is the real Vault Prediction column from oracle row
`01-baseline`. Tabular figures align the digits but not the decimal point.

Padding to `2.00` would change rendered text, and L2 compares rendered text
against `expected.json`. **That is a golden-master change wearing a formatting
change's clothes, and it is out of bounds.** The ledger aligns right on tabular
figures and accepts the ragged decimal, which is what the tool does today.

---

## 7. The charts

`src/normality/` is hand-rolled SVG since #51, so it restyles freely.

**The histogram** takes indigo bars on a `--rule` grid, title in Poppins 500,
every axis numeral in `--prose`. It currently reads Bootstrap's `--secondary` and
`--dark` at render time; those become Treeye token names.

**The gauge** is red/amber/green today, which misreads a band set that is
symmetric about the median and puts the one colour pair a clinician may not
distinguish on a clinical readout. It becomes a diverging band — crimson → ember →
jade → ember → crimson — and **#138** gives it `role="img"` and an accessible name
stating the value and the band it falls in, so the reading is available as text
and colour is reinforcement rather than the sole channel.

### 7.1 The `buildZones` refactor (decision 5)

Two options were considered for §2.3.

**Held at zero lines.** Keep the CSS-custom-property indirection and repoint the
names at Treeye tokens. Under jsdom they still resolve to `""`, so the 30 entries
do not move and the snapshot diff is zero.

**Refactored cleanly — chosen.** `buildZones` computes percentile bands over a
542-row dataset; that it reaches into `document.body`'s computed style to decide
colours is a layering violation, and the 30 `"color": ""` entries are a record of
that leak failing silently under test. `buildZones` returns geometry only
(`{min, max}[]`), the `Quantile` type collapses from `{value, color}` to a number,
the module-scope `getComputedStyle` call disappears, and `Gauge.tsx` supplies
colour when it builds `Zone[]` for `LinearGauge`.

The cost is 30 lines in `src/golden/__snapshots__/replay.test.ts.snap` — **all
deletions, with every `min` and `max` line byte-identical**. That is a diff a
reviewer can verify by eye in seconds, and afterwards the fixture locks only the
arithmetic it claims to lock, so any future movement in it is unambiguous.

`src/normality/Gauge.test.tsx` asserts `color: ''` in `builds default zones
correctly` and passes colours in `builds zones correctly`; both become
geometry-only. Per §10 each must be proven capable of failing.

---

## 8. Accessibility

Four open defects, all carried (decision 4). #129 is already fixed in #130 and
must not regress.

| | defect | fixed by | fixture moved |
|---|---|---|---|
| #137 | regression row labels are `scope="col"` | PR 2, alone | `regression.aria.yml` |
| #136 | four axis fields named `"@"` | §5.5, in PR 4 | `patient.aria.yml` |
| #139 | `Sphere`/`Cylindre`/`Axis` duplicated | §5.5, in PR 4 | `patient.aria.yml` |
| #138 | the Gauge is absent from the tree | §7, in PR 6 | `normality.aria.yml` |

#122 records that three of #121's new tests are written against the *defective*
tree — `CorneaProfile.test.tsx` reaches the axis fields positionally because they
share a name, `ICLContainer.test.tsx` pins fields by `id` because three labels are
ambiguous, and the gauge's assertions live in `linear-gauge/index.test.ts` because
the component is unreachable by any query. Fixing the defects should let those
tests get **better** — addressed by accessible name, and reachable by role — not
be worked around. A test that has to become *more* indirect after a fix is a
signal the fix is wrong.

---

## 9. What must not move

- **`src/data.csv` and `src/golden/expected.json`.** CI-enforced by
  `golden-master-guard`. If L2 goes red after PR 1 has landed, the reskin broke
  arithmetic or wiring: stop, do not touch the fixture, do not fix forward. A
  deliberate correction needs an `oracle/*` branch and per-value justification
  (spec §7.3).
- **The base path.** `/icl-calc/` in `vite.config.ts`, in
  `import.meta.env.BASE_URL` on the brand link, and in the `test.env` pin. A test
  asserts the brand link renders `/icl-calc/`; if it fails, something moved that
  should not have. It changes in #123, not here.
- **The frozen oracle worktree** at `../icl-calc-oracle` (tag
  `golden-master-oracle` → 789ac2d). Never written to.
- **Coverage floors** — 98.96 / 98.11 / 99.39 / 99.13, currently sitting exactly
  on those numbers with zero headroom. A floor is never lowered to go green; a
  drop is understood first. `src/util.ts`'s `getClassName` disappears with
  Bootstrap's validation classes, which removes covered lines — watched per PR.

---

## 10. Proof obligations

Every PR: `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm test`,
and for any change under `src/`, the L2 browser replay.

**Never run L2 and `visual-assert` at once.** Both bind port 4022 with
`reuseExistingServer: true`, so the second silently validates the first's build
and goes green.

**Every new or changed test must be proven capable of failing** — break the thing
it checks, see red, restore, see green, report both, with each assertion mutated
individually rather than read. This project has found six tests that passed for
years while asserting nothing, and phase 0 found two more in its own new tests.

**Per-PR fixture accounting.** Each PR states, before review, which fixtures it
expects to move and why. Screenshots are regenerated in the container CI uses:

```sh
npm run build
bash e2e/setup.sh --subject-only
docker run --rm -v "$PWD":/work -w /work/e2e -e SUBJECT_ONLY=1 \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=visual-assert --update-snapshots
```

An aria fixture moving in a PR that did not expect to move one is a stop signal,
not a regeneration.

**Review happens on the preview, not on CI.** Every merge into `treeye-reskin`
republishes both previews, and Cloudflare's per-commit URLs are permanent, so
before and after can be put side by side as live pages.

---

## 11. Delivery

Eight pull requests, each against `treeye-reskin`, merged one at a time with the
publish watched before the next.

| # | PR | fixtures expected to move |
|---|---|---|
| 0 | `docs:` this design | none |
| 1 | `test:` address the browser gates by role and name, not by class | **none** — zero `src/` diff is the proof |
| 2 | `fix:` associate regression row labels with their own rows (#137) | `regression.aria.yml` |
| 3 | `feat:` adopt the Treeye design system and drop Bootstrap | all 14 screenshots; `separator` entries in all four aria fixtures |
| 4 | `feat:` rebuild the patient form on the measured-row pattern (#136, #139) | patient ×2; ~40 lines of `patient.aria.yml` |
| 5 | `feat:` rebuild the result tables on the ledger pattern | matrix ×2, regression ×2; aria unchanged |
| 6 | `feat:` restyle the charts and name the gauge (#138) | normality ×2; `normality.aria.yml`; 30 deletions in `replay.test.ts.snap` (§7.1) |
| 7 | `feat:` add built-in input presets (#65) | patient ×2; `patient.aria.yml` |

### 11.1 Why the harness is decoupled first

§2.2. PR 1 touches no file under `src/`, so **L2 green plus fourteen
byte-identical screenshots is the evidence that it changed nothing** — the change
proves itself. Every PR after it then runs against a harness that measures values
rather than class names.

### 11.2 Why Bootstrap leaves in PR 3, not last

#122's suggested decomposition puts "Bootstrap removal and dead-CSS sweep" last,
once nothing depends on it. Pressure-testing that: it means PRs 3–6 each render a
hybrid that never ships, and every one of those diffs carries
framework-versus-token collisions that are not the design. The owner reviews four
intermediate looks that are artefacts of the sequence.

The alternative — drop Bootstrap first and leave regions unstyled until their PR
— trades one bad intermediate state for another.

So PR 3 lands tokens, the reset, the fonts and a **base element layer** together:
bare `input`, `select`, `button`, `table`, `th`, `td` styled in the Treeye idiom.
No route is ever unstyled or hybrid, every later PR is additive refinement of one
region, and Bootstrap's removal is a single self-contained diff. Its production
surface is only four files plus `package.json`; the bulk is one new stylesheet.

### 11.3 Why #65 is last and separate

#122's reasoning, adopted unchanged: this phase's safety argument is
*presentation only, so a red L2 means broken arithmetic*. A feature that sets form
values destroys that invariant, because a red L2 becomes ambiguous between the
reskin and the presets. Built-in presets only — no `localStorage`, no URL-encoded
sharing, both rejected in #122 on privacy grounds. Preset values are **copied**
from the golden rows, never imported: `src/golden/inputs.json` is guarded, and a
product decision about preset wording must not be able to fail a numerical gate.

### 11.4 Stacked branches

Squash-merging breaks stacked PRs: after a squash the base commit is no longer an
ancestor, so a stacked branch needs `git rebase --onto treeye-reskin <old-base>`,
not a retarget. This bit phase 0 once.

---

## 12. Release policy

**This phase cuts v2.0.0**, once, when the integration branch reaches `main`.

The individual PRs into `treeye-reskin` are `feat:`, `fix:`, `test:`, `docs:` and
`style:` as appropriate, and cut nothing.

The mechanics are counter-intuitive and have already cost this project a spurious
major withdrawn by hand (see v1.9.2's release notes):

- A **line-initial breaking-change footer in a commit body** cuts a major, and it
  works. This is how v2.0.0 is cut — deliberately, in the merge commit body, when
  the phase is complete.
- A **`!` type suffix does not.** `feat!:` cuts nothing at all, not even a minor:
  the angular preset reads the type as `feat!` and matches no rule.

That footer token triggers a major at the start of **any** line in **any** commit
body, including prose describing this rule — which is how it has gone wrong twice
here. It is never written except in the one commit genuinely meant to cut the
major. Everywhere else, including this document, it is "the breaking-change
footer".

---

## 13. Hazards

| hazard | mitigation |
|---|---|
| L2 red for presentational reasons | PR 1, before any design work (§2.2) |
| Coverage floors have zero headroom | `getClassName` leaves with Bootstrap; watched per PR (§9) |
| `replay.test.ts.snap` moving | expected, bounded, deletions only, reviewed (§7.1) |
| Aria fixtures moving more than expected | per-PR fixture accounting; unexpected movement stops the PR (§10) |
| Screenshots regenerated on the wrong platform | container only; image tag tracks `@playwright/test` in `e2e/package-lock.json` |
| Two Playwright projects at once | never; both bind 4022 and the second goes silently green (§10) |
| `#41`, `#123`, `#124`, `#126`, `#127` drifting in | out of scope; the TODO in `src/formulas.ts` (line 46 today — #122's brief says 45) is not deleted, and `sonarjs/todo-tag` is `'off'` in `eslint.config.mjs` precisely so CI cannot pressure anyone into removing the marker instead of implementing the clinical warning it marks |

---

## 14. Gate

The calculator is visually of a piece with the Treeye site — palette, both
typefaces, banding, chrome, cards — reviewed on the preview at more than one
viewport. Bootstrap is gone and #117 is closed. `src/data.csv` and
`src/golden/expected.json` are untouched and L2 is clean, proving no computed
clinical value moved. The four accessibility defects are fixed and their fixtures
justified. Visual coverage from #121 passes and would catch a regression.
v2.0.0 is cut deliberately.
