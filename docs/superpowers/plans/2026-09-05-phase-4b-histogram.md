# Phase 4b — Replace the amCharts histogram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Reimplement `src/normality/Histogram.tsx` as hand-rolled SVG, remove
`@amcharts/amcharts4`, and change none of the numbers behind the chart.

**Architecture:** The histogram is a pure function of `HistogramEntry[]` —
ten bins derived from `src/data.csv` at module load, identical on every render
and independent of form input. amCharts drew it imperatively into a `div` via
`useLayoutEffect`. The replacement returns SVG directly from render: no refs,
no effects, no disposal, and therefore no reason it cannot run under jsdom.

**Tech Stack:** React 19.2, Vite 4, Vitest 1.6, `@testing-library/react` 16.
No charting library.

**Spec:** `docs/superpowers/specs/2026-08-30-icl-calc-modernization-design.md`
(phase 4b) · **Issue:** #51

## Global Constraints

- `src/data.csv` and `src/golden/expected.json` must not change. CI-gated;
  spec §7.3 stop rule.
- The `HISTOGRAM_DATA` L1 snapshot must not change. **The chart is redrawn;
  the numbers behind it are not.**
- Do not change `src/db.ts`. The binning lives there and is already locked.
- Do not touch the ESLint stack (#63), Sentry (`src/index.tsx`), or the router.
- Browser floor `chrome87 / edge88 / firefox78 / safari14`.
- Conventional commits. No `BREAKING CHANGE:` or `!` — the 2.0.0 declaration
  belongs to the `modernize` → `master` merge (#52).

---

## Established facts — verified, do not re-derive

Captured from a real build of `392ceb7` before any change; images and full
notes in `docs/histogram-reference/`.

**1. The y-axis maximum is NOT what the source asks for.** `Histogram.tsx`
sets `valueAxis.max = Math.max(100, ...counts)`, but amCharts treats that as a
hint and rounds up to a nice value. Observed across the six:

| Metric | Max count | Rendered axis max |
| --- | --- | --- |
| ATA | 125 | 150 |
| CLR | 126 | 150 |
| ACD | 115 | 150 |
| ACA | 175 | **200** |
| WtW | 141 | 150 |
| Age | 131 | 150 |

Every axis steps by 50. A reimplementation written from the source alone would
produce maxes of 125/126/115/175/141/131 and look subtly wrong. **Use
`Math.ceil(Math.max(100, ...counts) / 50) * 50`.**

**2. The x-axis labels every other bin** — five of ten, driven by
`minGridDistance = 30`. Labels are the bins' `from` values, at indices
0, 2, 4, 6, 8.

**3. Colours come from Bootstrap CSS variables at runtime**, not hardcoded:
`--secondary` for bar fill, `--dark` for stroke. Read them the same way
(`getComputedStyle(document.body).getPropertyValue(...)`) so a Bootstrap theme
change still flows through. Note `Gauge.tsx` already does this at module
scope, so the pattern is established in this directory.

**4. The bin counts.** Ten bins, all 542 eyes counted exactly once:

| Metric | Counts (bins 0-9) |
| --- | --- |
| ATA | 1, 14, 31, 80, 125, 124, 86, 68, 10, 3 |
| CLR | 11, 23, 79, 126, 118, 109, 56, 15, 2, 3 |
| ACD | 34, 72, 106, 115, 110, 56, 25, 21, 2, 1 |
| ACA | 5, 48, 114, 175, 121, 53, 22, 3, 0, 1 |
| WtW | 1, 0, 2, 13, 88, 125, 141, 108, 51, 13 |
| Age | 9, 79, 131, 75, 91, 56, 31, 49, 19, 2 |

`getHistogramData` uses `find`, so a value landing exactly on a bin boundary
falls in the **earlier** bin. Do not touch that code — it is noted only so you
recognise these numbers as correct.

**5. Three tests are skipped solely because amCharts will not run under
jsdom**, and two files are excluded from coverage for the same reason. All of
them are unblocked by this change and Task 2 turns them back on.

---

## Task 1: The SVG histogram

**Files:**
- Rewrite: `src/normality/Histogram.tsx`
- Create: `src/normality/Histogram.test.tsx`
- Modify: `package.json` (remove `@amcharts/amcharts4`), `package-lock.json`

**Interfaces:**
- Produces: `Histogram({ data, title }: { data: HistogramEntry[]; title: string })`
  — **the props are unchanged**, so `src/normality/index.tsx` must not need
  editing. If you find yourself changing it, stop and say why.

- [ ] **Step 1: Read the reference before writing anything**

Read `docs/histogram-reference/README.md` and look at
`docs/histogram-reference/_full-tab.png`. You are reproducing what is in that
image, not inventing a chart.

- [ ] **Step 2: Write the failing test**

Create `src/normality/Histogram.test.tsx`:

```tsx
import { Histogram } from './Histogram';
import { HISTOGRAM_DATA } from '../db';
import { render, screen } from '@testing-library/react';

it('draws one bar per bin', () => {
  const { container } = render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(container.querySelectorAll('[data-testid="bar"]')).toHaveLength(10);
});

it('renders the title', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getByText('Angle to Angle - AtA (mm)')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run src/normality/Histogram.test.tsx`
Expected: FAIL — under amCharts this renders an empty `div` under jsdom.
That failure is the point: it demonstrates the old component was untestable.

- [ ] **Step 4: Implement**

Replace the file entirely. Requirements, in priority order:

- Pure render — **no `useRef`, no `useLayoutEffect`, no `useEffect`, no
  cleanup**. If you reach for a ref you have taken a wrong turn.
- A single `<svg>` with a `viewBox` and `width="100%"`, scaling
  proportionally. **Note this is a deliberate change from amCharts' fixed
  300px height**: without measuring the container there is no way to keep a
  fixed pixel height and a correct aspect ratio at the same time, and
  distorting text to achieve it would be worse. Record this in a comment; the
  owner reviews it visually.
- Y axis: ticks every 50 from 0 to
  `Math.ceil(Math.max(100, ...counts) / 50) * 50`, a horizontal gridline and
  a numeric label per tick, plus the rotated axis title `Number of Eyes`.
- X axis: a label under bins 0, 2, 4, 6, 8 showing that bin's `from` value.
  Match the reference's formatting — `10.72`, `-470`, `24.4` — i.e. drop
  trailing zeros rather than pad to a fixed precision.
- Bars: fill from `--secondary`, stroke from `--dark`, read at render time
  via `getComputedStyle(document.body).getPropertyValue(...)` and `.trim()`.
  Give each `data-testid="bar"`.
- Title centred above the plot, ~1rem.
- Keep the tooltip information reachable: amCharts showed
  `Interval: [{from}, {to}[` and `Number of Eyes: {count}` on hover. A
  `<title>` element inside each bar gives native SVG tooltips with no
  library. Include both numbers.
- Accessibility: give the `<svg>` `role="img"` and an `aria-label` naming the
  metric. The old canvas-less amCharts SVG had none.

- [ ] **Step 5: Green, then remove the dependency**

```bash
npx vitest run src/normality/Histogram.test.tsx   # expect PASS
npm uninstall @amcharts/amcharts4
```

Run `npm uninstall` in the background and poll — a foreground npm command
that goes quiet for minutes gets killed by a stall watchdog.

- [ ] **Step 6: Prove no amCharts remains**

```bash
grep -rn "amcharts" src/ package.json vite.config.ts ; echo $?
npm run build
grep -rl "amcharts" build/assets/ ; echo $?
```

Report both exit codes. The first grep should find nothing in `src/` or
`package.json` (comments in test files referring to the *history* are fine and
Task 2 updates them). The bundle must contain no amCharts at all.

- [ ] **Step 7: Gates**

```bash
npm run lint      ; echo $?
npx tsc --noEmit  ; echo $?
npm test          ; echo $?
```

All 0. `npm test` must show the `HISTOGRAM_DATA` snapshot **unchanged** — if
it reports a snapshot write or obsolete snapshot for it, stop: the data
behind the chart has moved and that is the one thing this phase must not do.

- [ ] **Step 8: Commit**

```bash
git add src/normality/Histogram.tsx src/normality/Histogram.test.tsx \
        package.json package-lock.json
git commit -m "feat(normality): hand-rolled SVG histogram, drop amCharts 4

amCharts 4 is end-of-life and licence-sensitive - not unconditionally free
for commercial or closed-source use - and was carrying exactly one chart.

The replacement renders SVG directly with no refs, effects or disposal, so
it works under jsdom where amCharts never did.

Reproduces the reference in docs/histogram-reference/, including the axis
maximum amCharts actually used rather than the one the old source asked
for: valueAxis.max was a hint that got rounded up to a multiple of 50,
which is why ACA's axis reaches 200 while the other five stop at 150."
```

---

## Task 2: Turn the skipped tests back on

The three `it.skip`s and two coverage exclusions exist only because amCharts
would not run under jsdom. That reason is now gone. Leaving them would keep
the Normality tab permanently unverified.

**Files:** `src/normality/index.test.tsx`, `src/ICLContainer.test.tsx`,
`vite.config.ts`

- [ ] **Step 1: Un-skip `src/normality/index.test.tsx`**

Restore the commented-out assertion too — the whole test body is currently
commented out, so even un-skipped it would assert nothing:

```tsx
import { Normality } from '.';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(
    <Normality ata={11.8} clr={0} acd={4.1} aca={31} wtw={8.6} age={20} />
  );
  expect(asFragment()).toMatchSnapshot();
});
```

- [ ] **Step 2: Un-skip the two `ICLContainer` tests**

`switches to Biometric Normality tab when clicked` and `renders Biometric
Normality on #normality route`. Delete the `// While using amcharts 4 …`
comments above them.

The first asserts `getByText(/Normality Graphs are coming soon/)`. That string
almost certainly no longer exists — check, and if so replace the assertion
with something the tab actually renders now, such as one of the six chart
titles. **Say in your report what you changed it to and why.**

- [ ] **Step 3: Add the `#normality` legacy-URL case**

Phase 3c omitted `#normality` from its legacy-hash tests because amCharts
would not render. Add it to both `it.each` blocks in `src/ICLContainer.test.tsx`
alongside `#matrix` and `#regression`, using a title the Normality tab renders.

- [ ] **Step 4: Remove the coverage exclusions**

In `vite.config.ts`, delete `'src/normality/Histogram.tsx'` and
`'src/normality/index.tsx'` from `test.coverage.exclude`. Leave the comment
about `linear-gauge` intact.

- [ ] **Step 5: Gates, and report the coverage numbers**

```bash
npm run lint      ; echo $?
npx tsc --noEmit  ; echo $?
npm test          ; echo $?
```

All 0, no skipped tests remaining in these files. Report the coverage
percentages now reported for `Histogram.tsx` and `normality/index.tsx` — they
were invisible before.

- [ ] **Step 6: Commit**

```bash
git add src/ vite.config.ts
git commit -m "test(normality): un-skip the tests amCharts was blocking

Three tests were skipped and two files excluded from coverage for one
reason - amCharts 4 would not run under jsdom. The SVG replacement does, so
the Normality tab is verified for the first time.

Also adds the #normality legacy-hash case that phase 3c had to leave out."
```

---

## Task 3: Capture the after-shots and reconcile the docs

- [ ] **Step 1: Capture**

```bash
npm run build
cd e2e && ./setup.sh --subject-only
OUT_DIR=../.superpowers/histogram-after SUBJECT_ONLY=1 \
  npx playwright test --project=visual
```

All seven PNGs must be produced. If `waitForStableSvg` times out, the SVG is
animating — it should not be.

- [ ] **Step 2: Reconcile the spec and findings**

Spec phase table row 4b and the findings' `Charts | amCharts 4` row, in the
in-place `>` annotation style both documents already use. Record: amCharts
gone, licence question closed, the axis-rounding fact, the proportional-height
change, and that three tests came off `skip`.

- [ ] **Step 3: Verify nothing stale remains**

```bash
grep -rn "amcharts\|amCharts" src/ docs/ vite.config.ts package.json
```

Every remaining hit must be historical text under an annotation, or the
reference README. Report the list.

- [ ] **Step 4: Commit**

---

## Done when

1. lint / tsc / test all exit 0.
2. `HISTOGRAM_DATA` snapshot unchanged; `expected.json` and `data.csv` untouched.
3. L2 browser replay still reproduces the oracle exactly.
4. No amCharts in `src/`, `package.json`, or the built bundle.
5. No `it.skip` left in `src/normality/` or for the Normality tab.
6. `.superpowers/histogram-after/` holds all seven PNGs for the owner's review.
