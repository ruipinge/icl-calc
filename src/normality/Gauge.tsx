import { LinearGauge, Zone } from './linear-gauge';
import { useLayoutEffect, useRef } from 'react';

/**
 * https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
 *
 * @param {number[]} values - Dataset
 * @param {number} quantile - Quantile [0.0, 1.0]
 * @returns {number}
 */
export const quantile = (values: number[], quantile: number) => {
  const sorted = values.sort((a, b) => a - b);
  const pos = (sorted.length - 1) * quantile;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

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
  const qq = quantiles.map((q) => quantile(values, q.value));
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
    <div style={{ marginLeft: '71px', marginRight: '15px' }} ref={container} />
  );
};
