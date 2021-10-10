import { Gauge, buildZones, quantile } from './Gauge';
import { create, act as testAct } from 'react-test-renderer';

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

it('renders without crashing', async () => {
  let tree;
  await testAct(async () => {
    tree = create(<Gauge value={4} values={DATASET} />);
  });

  // @ts-ignore
  expect(tree.toJSON()).toMatchSnapshot();
});
