import { LinearGauge, Options, Zone } from './linear-gauge';
import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { measurement } from '../missing';

/**
 * Ascending numeric sort of a *copy*. `Array.prototype.sort` sorts in place,
 * and the arrays reaching this module are the shared, module-level
 * `VALUES.ATA`/`CLR`/`ACD`/`ACA`/`WTW`/`AGE` from src/db.ts - sorting them
 * directly would permanently reorder them out of CSV row order for the
 * lifetime of the page, for every other reader (issue #58).
 *
 * @param {number[]} values - Dataset, not modified
 * @returns {number[]} a new array, ascending
 */
const sortedCopy = (values: number[]): number[] =>
  [...values].sort((a, b) => a - b);

/**
 * The interpolation half of `quantile`, split out so `buildZones` can sort
 * once per call instead of once per quantile. Takes an already-ascending
 * array; produces exactly what `quantile` would, since `quantile`'s only
 * use of `values` is the sorted sequence.
 *
 * @param {number[]} sorted - Dataset, already sorted ascending
 * @param {number} quantile - Quantile [0.0, 1.0]
 * @returns {number}
 */
const quantileOfSorted = (sorted: number[], quantile: number) => {
  const pos = (sorted.length - 1) * quantile;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

/**
 * https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
 *
 * Does not modify `values`.
 *
 * @param {number[]} values - Dataset
 * @param {number} quantile - Quantile [0.0, 1.0]
 * @returns {number}
 */
export const quantile = (values: number[], quantile: number) =>
  quantileOfSorted(sortedCopy(values), quantile);

export type Band = { readonly min: number; readonly max: number };

export const QUANTILES: readonly number[] = [0.025, 0.25, 0.75, 0.975, 1.0];

/**
 * Band geometry only: colour is the view's concern.
 */
export const buildZones = ({
  values,
  quantiles = QUANTILES
}: {
  values: number[];
  quantiles?: readonly number[];
}): Band[] => {
  // Sorted once here rather than once inside each quantile() call: Gauge
  // memoises this on `values`, so it runs once per gauge per dataset, over
  // the 542-element shared arrays, for six gauges. `values` itself is left
  // untouched.
  const sorted = sortedCopy(values);
  const qq = quantiles.map((q) => quantileOfSorted(sorted, q));
  return qq.map((max, index) => ({
    min: index === 0 ? Math.min(...values) : qq[index - 1],
    max
  }));
};

/**
 * One colour per band, in band order: the tails are crimson, the shoulders
 * ember, the middle jade. Tokens come from the Treeye palette in App.css.
 */
export const ZONE_COLOURS = [
  'var(--leaf-crimson)',
  'var(--leaf-ember)',
  'var(--leaf-jade)',
  'var(--leaf-ember)',
  'var(--leaf-crimson)'
] as const;

const BAND_NAMES = [
  'below the 2.5th percentile',
  'between the 2.5th and 25th percentiles',
  'between the 25th and 75th percentiles',
  'between the 75th and 97.5th percentiles',
  'above the 97.5th percentile'
] as const;

/**
 * Names the band a value falls in, for the gauge's accessible name and its
 * visible caption. Bands are half-open `[min, max)` except the last, which is
 * closed. A value under the first band is below the range of the dataset, one
 * over the last band is above it. A value no band holds for any other reason
 * (NaN, or no bands at all) is outside the range, never `undefined`; NaN never
 * reaches this from Gauge, since `measurement` filters it.
 *
 * @param {number} value - The measurement
 * @param {Band[]} bands - From `buildZones`
 * @returns {string}
 */
export const describeBand = (value: number, bands: Band[]): string => {
  const last = bands.length - 1;
  if (last >= 0 && value < bands[0].min) {
    return 'below the range of the dataset';
  }
  if (last >= 0 && value > bands[last].max) {
    return 'above the range of the dataset';
  }
  const index = bands.findIndex(
    (band, i) => value < band.max || (i === last && value <= band.max)
  );
  return index === -1 ? 'outside the range of the dataset' : BAND_NAMES[index];
};

/**
 * Paper between neighbouring zones, so every band edge is a visible boundary
 * and does not rest on colour alone (WCAG 1.4.11): ember and jade, and crimson
 * and ember, are too close for colour-blind readers. Paint only - see
 * `ZoneGap` - so the pointer still sits over its value.
 */
export const ZONE_GAP = { width: 2, color: 'var(--paper)' } as const;

/**
 * Everything Gauge passes to `LinearGauge.setOptions`, kept out of the
 * layout effect so it can be asserted: the zones in band order with their
 * colours, the paper gap, the divisions, and the value through the same
 * `measurement` rule as the name.
 *
 * @param {unknown} value - The measurement, as it reached the component
 * @param {Band[]} bands - From `buildZones`
 * @returns {Options}
 */
export const gaugeOptions = (value: unknown, bands: Band[]): Options => ({
  divisions: 5,
  subDivisions: 2,
  zones: bands.map((band, index): Zone => ({
    ...band,
    color: ZONE_COLOURS[index]
  })),
  zoneGap: ZONE_GAP,
  value: measurement(value)
});

/**
 * The band half of the gauge's name, which the gauge also shows as its
 * caption: one function, so what is spoken and what is seen cannot disagree.
 *
 * @param {number | undefined} value - From `measurement`
 * @param {Band[]} bands - From `buildZones`
 * @returns {string}
 */
export const gaugeBand = (value: number | undefined, bands: Band[]): string =>
  value === undefined ? 'no value entered' : describeBand(value, bands);

/**
 * The gauge's accessible name. The value is read to 12 significant digits so
 * float artefacts of derived values (ACA is a mean) are not spoken. Only the
 * name: what the gauge draws is decided by the same `measurement` rule.
 *
 * @param {string} title - The metric
 * @param {number | undefined} value - From `measurement`
 * @param {Band[]} bands - From `buildZones`
 * @returns {string}
 */
const gaugeName = (
  title: string,
  value: number | undefined,
  bands: Band[]
): string =>
  value === undefined
    ? `${title}: ${gaugeBand(value, bands)}`
    : `${title}: ${Number(value.toPrecision(12))}, ${gaugeBand(value, bands)}`;

export const Gauge = ({
  title,
  value,
  values
}: {
  title: string;
  value: number | undefined;
  values: number[];
}) => {
  const container = useRef<HTMLDivElement>(null);
  // The name and the drawing share these bands, so they cannot disagree.
  const present = measurement(value);
  const bands = useMemo(() => buildZones({ values }), [values]);

  /* istanbul ignore next */
  useLayoutEffect(() => {
    if (container.current === null) {
      return;
    }

    let x: LinearGauge = new LinearGauge(container.current);
    x.setOptions(gaugeOptions(value, bands));

    return () => {
      x.dispose();
    };
  });

  // Insets shared with the histogram above - see plot-inset.ts for why
  // these two must agree. The caption shares them so it aligns with the bar.
  const inset = {
    marginLeft: `${PLOT_INSET_LEFT}px`,
    marginRight: `${PLOT_INSET_RIGHT}px`
  };

  return (
    <>
      {/* LinearGauge owns and disposes this div's children, and the L2
          replay reads its first svg and inline style: nothing goes inside
          or before it. */}
      <div
        data-testid="gauge"
        role="img"
        aria-label={gaugeName(title, present, bands)}
        style={inset}
        ref={container}
      />
      {/* aria-hidden: the gauge's name already speaks the band. */}
      <p className="gauge-band" aria-hidden="true" style={inset}>
        {gaugeBand(present, bands)}
      </p>
    </>
  );
};
