import { Gauge, buildZones, quantile } from './Gauge';
import { render } from '@testing-library/react';

const DATASET = [
  1,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  5,
  6,
  6,
  6,
  6,
  6,
  6,
  7,
  7,
  7,
  7,
  7,
  7,
  7
];

it('calculates quantile correctly', () => {
  expect(quantile([1, 2, 3], 0.5)).toEqual(2);
  expect(quantile([1, 2, 3, 4], 0.975)).toEqual(3.925);
  expect(quantile([1, 2, 3, 4], 0.025)).toEqual(1.075);
  expect(quantile([1, 2, 3, 4], 1.0)).toEqual(4);
  expect(quantile([1, 2, 3, 4], 0.0)).toEqual(1);

  expect(quantile([4, 3, 2, 1], 0.0)).toEqual(1);
  expect(quantile([4, 3, 2, 1], 1.0)).toEqual(4);

  expect(quantile(DATASET, 0.25)).toEqual(4);
  expect(quantile(DATASET, 0.5)).toEqual(5);
  expect(quantile(DATASET, 0.75)).toEqual(6.25);
});

// Issue #58: quantile() used to sort its argument in place, permanently
// reordering the caller's array. Its callers pass the shared, module-level
// VALUES.* arrays from src/db.ts, so the first gauge render reordered the
// whole dataset out of CSV row order for everyone else. These two pin the
// no-mutation guarantee; DATASET above must not be used here, because a
// mutating implementation would corrupt it for every other test in the file.
it('leaves the caller array untouched when computing a quantile', () => {
  const values = [4, 3, 2, 1];

  expect(quantile(values, 0.5)).toEqual(2.5);
  expect(values).toEqual([4, 3, 2, 1]);
});

it('leaves the caller array untouched when building zones', () => {
  const values = [7, 6, 5, 4, 3, 2, 1];

  buildZones({ values });

  expect(values).toEqual([7, 6, 5, 4, 3, 2, 1]);
});

it('builds default zones correctly', () => {
  expect(buildZones({ values: DATASET })).toEqual([
    { min: 1, max: 1.675, color: '' },
    { min: 1.675, max: 4, color: '' },
    { min: 4, max: 6.25, color: '' },
    { min: 6.25, max: 7, color: '' },
    { min: 7, max: 7, color: '' }
  ]);
});

it('builds zones correctly', () => {
  expect(
    buildZones({
      values: DATASET,
      quantiles: [
        {
          value: 0.2,
          color: 'red'
        },
        {
          value: 0.8,
          color: 'green'
        },
        {
          value: 1.0,
          color: 'red'
        }
      ]
    })
  ).toEqual([
    { min: 1, max: 3.4000000000000004, color: 'red' },
    { min: 3.4000000000000004, max: 7, color: 'green' },
    { min: 7, max: 7, color: 'red' }
  ]);
});

it('renders without crashing', () => {
  const { asFragment } = render(<Gauge value={4} values={DATASET} />);
  expect(asFragment()).toMatchSnapshot();
});
