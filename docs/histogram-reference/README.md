# Histogram visual reference — amCharts 4, captured before #51

> **#51 has shipped.** The replacement is hand-rolled SVG in
> `src/normality/Histogram.tsx`. These images stay as the record of what was
> replaced. One correction to the notes below, learned during the work: the
> chart cannot scale to fit its column, because the gauge beneath it shares the
> same horizontal scale and positions with fixed pixel margins — see design
> spec §6.5.

These are the six Normality histograms as amCharts 4 rendered them, captured
from a real build of `392ceb7` (the commit before the replacement) at a
1280×900 viewport.

**Why they are committed rather than regenerated on demand.** Issue #51
removes `@amcharts/amcharts4` from the project. Once it is gone, reproducing
this "before" state means checking out an old commit *and* reinstalling a
dependency that is end-of-life and licence-sensitive — which is exactly what
the phase exists to avoid. These files are the archival record, the same
reasoning that froze the December 2021 build into a read-only worktree for the
numeric golden master.

**What they are not.** They are not a gate. Nothing in CI compares against
them, and they are not pixel-perfect targets — a hand-rolled SVG chart will
not match amCharts glyph for glyph, and should not try to. The numeric gate
for #51 is the L1 `HISTOGRAM_DATA` snapshot, which proves the data behind the
chart is unchanged. These prove what the chart *looked* like, which no
automated gate covers and which the owner reviews by eye.

## Regenerating

The capture harness lives in `e2e/histogram-visual.spec.ts` and runs against
whatever `npm run build` last produced:

```bash
npm run build
cd e2e && ./setup.sh --subject-only
OUT_DIR=<dir> SUBJECT_ONLY=1 npx playwright test --project=visual
```

It is deliberately excluded from CI — it is a tool, not an assertion.

## What the reference shows

Facts a reader would otherwise have to re-derive from the amCharts source:

- **The y-axis maximum is not what the code asks for.** `Histogram.tsx` sets
  `valueAxis.max = Math.max(100, ...counts)`, but amCharts treats that as a
  hint and rounds up to a "nice" value. Observed: ATA 125→150, CLR 126→150,
  ACD 115→150, ACA 175→**200**, WtW 141→150, Age 131→150. Every axis steps by
  50; ACA is the only one that reaches 200.
- **The x-axis labels every other bin**, five of ten, driven by
  `minGridDistance = 30`. The labels are the bins' `from` values.
- **Bar fill and stroke are read from Bootstrap 4 CSS variables at runtime** —
  `--secondary` for fill, `--dark` for stroke — not hardcoded.
- The y-axis carries a rotated "Number of Eyes" title; the chart title sits
  centred above with `marginBottom = 22` and `fontSize = 1rem`.
- Each histogram is 300px tall and full-width within a Bootstrap `.col-md-4`,
  so three sit per row on desktop with the gauge directly beneath each.

## The underlying counts

Ten bins per metric, every one of the 542 eyes counted exactly once. Note
`getHistogramData` uses `find`, so a value landing exactly on a bin boundary
falls in the **earlier** bin — a naive `filter` reimplementation double-counts
boundaries and will not reproduce these.

| Metric | Counts (bins 0-9) | Max | Axis max |
| --- | --- | --- | --- |
| ATA | 1, 14, 31, 80, 125, 124, 86, 68, 10, 3 | 125 | 150 |
| CLR | 11, 23, 79, 126, 118, 109, 56, 15, 2, 3 | 126 | 150 |
| ACD | 34, 72, 106, 115, 110, 56, 25, 21, 2, 1 | 115 | 150 |
| ACA | 5, 48, 114, 175, 121, 53, 22, 3, 0, 1 | 175 | 200 |
| WtW | 1, 0, 2, 13, 88, 125, 141, 108, 51, 13 | 141 | 150 |
| Age | 9, 79, 131, 75, 91, 56, 31, 49, 19, 2 | 131 | 150 |

These are the same numbers the L1 `HISTOGRAM_DATA` snapshot locks. If a
change makes this table and that snapshot disagree, the snapshot is right.
