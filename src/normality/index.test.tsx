import { render, screen, within } from '@testing-library/react';

import { HISTOGRAM_DATA } from '../db';
import { Normality } from '.';

/*
 * Replaces a 2,529-line asFragment() snapshot (#121). That fixture recorded
 * 91 SVG path attributes alongside every Bootstrap class, so a restyle moved
 * it wholesale while a chart drawn from the wrong data moved it no more
 * visibly.
 *
 * Charts are the one place #121's strategy does NOT become "assert text and
 * roles": an SVG chart exposes almost no accessible text, and its path
 * geometry is computed clinical data rather than presentation. Converting it
 * to text assertions would delete real coverage and report it as a cleanup.
 * So the geometry is asserted directly, on the model Histogram.test.tsx
 * already sets, and this file covers the composition: which charts, in what
 * order, drawn from which series.
 */
const GRAPHS = [
  ['Angle to Angle - AtA (mm)', HISTOGRAM_DATA.ata],
  ['Crystalline Lens Rise - CLR (μm)', HISTOGRAM_DATA.clr],
  ['Internal Anterior Chamber Depth - ACD (mm)', HISTOGRAM_DATA.acd],
  ['Average Anterior Chamber Angle - ACA (º)', HISTOGRAM_DATA.aca],
  ['White to White - WtW (mm)', HISTOGRAM_DATA.wtw],
  ['Age (years)', HISTOGRAM_DATA.age]
] as const;

const renderNormality = () =>
  render(
    <Normality ata={11.8} clr={0} acd={4.1} aca={31} wtw={8.6} age={20} />
  );

it('draws the six metrics in order', () => {
  renderNormality();

  expect(
    screen
      .getAllByTestId('histogram')
      .map((svg) => svg.getAttribute('aria-label'))
  ).toEqual(GRAPHS.map(([title]) => `Histogram of ${title}`));
});

/*
 * Each chart must be drawn from its OWN series, and bar count cannot show
 * that: all six metrics are binned into exactly ten intervals, so a chart
 * wired to the wrong series still renders ten bars and any count-based
 * assertion passes. Mutation-testing this file caught precisely that - a
 * version of this test comparing only lengths stayed green with all six
 * charts drawn from the AtA series.
 *
 * The bin boundaries do distinguish them, because the metrics are on
 * unrelated scales: millimetres, micrometres, degrees and years.
 */
it('draws each chart from its own series', () => {
  renderNormality();

  const charts = screen.getAllByTestId('histogram');

  GRAPHS.forEach(([title, series], index) => {
    expect(charts[index]).toHaveAttribute(
      'aria-label',
      `Histogram of ${title}`
    );
    expect(
      within(charts[index])
        .getAllByTestId('bar')
        .map((bar) => /Interval: (\[[^[]+\[)/.exec(bar.textContent ?? '')?.[1])
    ).toEqual(series.map((bin) => `[${bin.from}, ${bin.to}[`));
  });
});

/*
 * Every bar carries a native <title> naming its bin and count, which is the
 * only route a screen reader has into the chart's numbers. The counts across
 * a chart must account for all 542 rows of src/data.csv - a chart drawn from
 * a truncated or double-counted series would still render, and every other
 * assertion in this file would still pass.
 *
 * The gauge drawn beneath each histogram has no equivalent affordance: it is
 * styled divs with no text, role or label at all, so it is unreachable by
 * any query and invisible to assistive technology. That is a real gap in a
 * clinical tool, recorded here because this phase changes no markup.
 */
it('names every bar with its interval and eye count', () => {
  renderNormality();

  const bars = screen.getAllByTestId('bar');

  expect(bars).toHaveLength(
    GRAPHS.reduce((total, [, series]) => total + series.length, 0)
  );
  bars.forEach((bar) => {
    expect(bar).toHaveTextContent(
      /^Interval: \[-?[\d.]+, -?[\d.]+\[ Number of Eyes: \d+$/
    );
  });
});

it('accounts for every row of the dataset in each chart', () => {
  renderNormality();

  screen.getAllByTestId('histogram').forEach((chart) => {
    const counts = within(chart)
      .getAllByTestId('bar')
      .map((bar) =>
        Number(/Number of Eyes: (\d+)/.exec(bar.textContent ?? '')?.[1])
      );

    expect(counts.reduce((total, count) => total + count, 0)).toBe(542);
  });
});
