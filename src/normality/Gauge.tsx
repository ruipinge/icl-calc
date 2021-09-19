import { LinearGauge, Zone } from './linear-gauge';
import { useLayoutEffect, useRef } from 'react';

/**
 * https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
 *
 * @param {number[]} values - Data set
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

const buildZones = (values: number[]): Zone[] => {
  const qq = [0.025, 0.25, 0.5, 0.75, 0.975].map((q) => quantile(values, q));
  const green = getComputedStyle(document.body).getPropertyValue('--success');
  const red = getComputedStyle(document.body).getPropertyValue('--danger');
  const yellow = getComputedStyle(document.body).getPropertyValue('--warning');
  return [
    { min: Math.min(...values), max: qq[0], color: red },
    { min: qq[0], max: qq[1], color: yellow },
    { min: qq[1], max: qq[3], color: green },
    { min: qq[3], max: qq[4], color: yellow },
    { min: qq[4], max: Math.max(...values), color: red }
  ];
};

export const Gauge = ({
  value,
  values
}: {
  value: number;
  values: number[];
}) => {
  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (container.current === null) {
      return;
    }

    let x: LinearGauge = new LinearGauge(container.current);
    x.setOptions({
      divisions: 5,
      subDivisions: 2,
      zones: buildZones(values),
      value: value
    });

    return () => {
      x.dispose();
    };
  }, []);

  return (
    <div style={{ marginLeft: '71px', marginRight: '15px' }} ref={container} />
  );
};
