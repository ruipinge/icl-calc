import { LinearGauge, Zone } from './linear-gauge';
import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { useLayoutEffect, useRef } from 'react';

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

export type Quantile = {
  readonly value: number;
  readonly color: string;
};

const QUANTILES: Quantile[] = [
  {
    value: 0.025,
    color: getComputedStyle(document.body).getPropertyValue('--danger')
  },
  {
    value: 0.25,
    color: getComputedStyle(document.body).getPropertyValue('--warning')
  },
  {
    value: 0.75,
    color: getComputedStyle(document.body).getPropertyValue('--success')
  },
  {
    value: 0.975,
    color: getComputedStyle(document.body).getPropertyValue('--warning')
  },
  {
    value: 1.0,
    color: getComputedStyle(document.body).getPropertyValue('--danger')
  }
];

export const buildZones = ({
  values,
  quantiles = QUANTILES
}: {
  values: number[];
  quantiles?: Quantile[];
}): Zone[] => {
  // Sorted once here rather than once inside each quantile() call: this runs
  // from a useLayoutEffect with no dependency array, over the 542-element
  // shared arrays, for six gauges. `values` itself is left untouched.
  const sorted = sortedCopy(values);
  const qq = quantiles.map((q) => quantileOfSorted(sorted, q.value));
  return quantiles.map((q, index) => {
    if (index === 0) {
      return {
        min: Math.min(...values),
        max: qq[0],
        color: q.color
      };
    }
    return {
      min: qq[index - 1],
      max: qq[index],
      color: q.color
    };
  });
};

export const Gauge = ({
  value,
  values
}: {
  value: number;
  values: number[];
}) => {
  const container = useRef<HTMLDivElement>(null);

  /* istanbul ignore next */
  useLayoutEffect(() => {
    if (container.current === null) {
      return;
    }

    let x: LinearGauge = new LinearGauge(container.current);
    x.setOptions({
      divisions: 5,
      subDivisions: 2,
      zones: buildZones({ values: values }),
      value: value
    });

    return () => {
      x.dispose();
    };
  });

  return (
    // Insets shared with the histogram above - see plot-inset.ts for why
    // these two must agree.
    <div
      style={{
        marginLeft: `${PLOT_INSET_LEFT}px`,
        marginRight: `${PLOT_INSET_RIGHT}px`
      }}
      ref={container}
    />
  );
};
