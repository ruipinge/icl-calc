import { quantile } from './Gauge';

it('calculates quantile correctly', () => {
  expect(quantile([1, 2, 3], 0.5)).toEqual(2);
});
