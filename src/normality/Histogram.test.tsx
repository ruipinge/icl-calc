import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { render, screen } from '@testing-library/react';

import { HISTOGRAM_DATA } from '../db';
import { Histogram } from './Histogram';

it('draws one bar per bin', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getAllByTestId('bar')).toHaveLength(10);
});

it('renders the title', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getByText('Angle to Angle - AtA (mm)')).toBeInTheDocument();
});

/*
 * The gauge rendered directly beneath each histogram encodes the SAME
 * horizontal scale - it is the quantile band for the same metric - and
 * positions itself with CSS pixel margins. So the histogram's plot area has
 * to begin and end at exactly those insets, or the band stops sitting under
 * the values it describes.
 *
 * This went wrong once already and no test caught it: an earlier version of
 * this component scaled a viewBox to fit its column, which can satisfy the
 * alignment at one column width and drifts at every other. Both components
 * were individually correct; only the pair was wrong. It was found by eye.
 */
it('starts and ends its plot area at the inset the gauge uses', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );

  const svg = screen.getByTestId('histogram');
  const width = Number(svg.getAttribute('width'));

  // The y-axis gridlines span the full plot area, so their endpoints are the
  // plot's left and right edges.
  const gridline = screen.getAllByTestId('gridline')[0];

  expect(Number(gridline.getAttribute('x1'))).toBe(PLOT_INSET_LEFT);
  expect(Number(gridline.getAttribute('x2'))).toBe(width - PLOT_INSET_RIGHT);
});

it('keeps that alignment at a different container width', () => {
  // Same assertion, different width: a viewBox-scaled implementation passes
  // the test above at its one design width and fails here.
  render(<Histogram title="Age (years)" data={HISTOGRAM_DATA.age} />);

  const svg = screen.getByTestId('histogram');
  const width = Number(svg.getAttribute('width'));
  const bars = screen.getAllByTestId('bar');
  const lastBar = bars[bars.length - 1];

  const plotRight = width - PLOT_INSET_RIGHT;
  const lastBarRight =
    Number(lastBar.getAttribute('x')) + Number(lastBar.getAttribute('width'));

  // The final bar's slot ends at the plot's right edge; the bar itself is
  // inset by the gap between bars, so it must land just inside it.
  expect(lastBarRight).toBeLessThanOrEqual(plotRight);
  expect(lastBarRight).toBeGreaterThan(plotRight - 10);
});

/*
 * The x axis is labelled on every other bin, following what amCharts did at
 * minGridDistance = 30. Without this, nothing asserts the axis at all: bar
 * geometry and bar titles are covered above and in normality/index.test.tsx,
 * but the labels a clinician reads the scale off were only ever recorded by
 * the Normality asFragment() snapshot that #121 removes.
 *
 * Caught by mutation-testing the conversion: dropping the first axis label
 * left the whole suite green.
 *
 * The values are the AtA bin boundaries, rounded for display. Labelling
 * alternate bins is asserted in both directions - a labelled boundary is
 * present and the unlabelled one between two of them is absent - because an
 * implementation that labelled every bin would satisfy the first half alone.
 */
it('labels every other bin along the x axis', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );

  ['10.72', '11.288', '11.856', '12.424', '12.992'].forEach((label) => {
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  expect(screen.queryByText('11.004')).not.toBeInTheDocument();
  expect(screen.queryByText('11.572')).not.toBeInTheDocument();
});
