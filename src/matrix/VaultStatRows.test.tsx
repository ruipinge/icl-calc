import {
  VaultStatRows,
  getVaultAverages,
  getVaultMaxs,
  getVaultMins
} from './VaultStatRows';

import TestRenderer from 'react-test-renderer';
import { FILTER as filter } from './data.test';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<VaultStatRows ata={0} clr={0} />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('calculates vault size averages', () => {
  const avgs = getVaultAverages(filter);
  expect(avgs).toEqual([1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600]);
});

it('calculates vault size minimums', () => {
  const avgs = getVaultMins(filter);
  expect(avgs).toEqual([1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500]);
});

it('calculates vault size maximums', () => {
  const avgs = getVaultMaxs(filter);
  expect(avgs).toEqual([1300, 1600, 1900, 2200, 2500, 2800, 3100, 3400, 3700]);
});
