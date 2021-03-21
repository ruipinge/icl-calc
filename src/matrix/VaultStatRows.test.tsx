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
  expect(avgs).toEqual([1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.3, 3.6]);
});

it('calculates vault size minimums', () => {
  const avgs = getVaultMins(filter);
  expect(avgs).toEqual([1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9, 3.2, 3.5]);
});

it('calculates vault size maximums', () => {
  const avgs = getVaultMaxs(filter);
  expect(avgs).toEqual([1.3, 1.6, 1.9, 2.2, 2.5, 2.8, 3.1, 3.4, 3.7]);
});
