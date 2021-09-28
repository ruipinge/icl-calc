import {
  VaultDistributionRows,
  countByVaultRange,
  formatVaultSizeTexts,
  getVaultDistribution
} from './VaultDistributionRows';

import TestRenderer from 'react-test-renderer';
import { FILTER as filter } from './data.test';

it('renders without crashing', () => {
  const tree = TestRenderer.create(
    <VaultDistributionRows ata={0} clr={0} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

it('calculates vault size distribution with max', () => {
  const row = getVaultDistribution({ filter, range: { max: 1500 } });
  expect(row).toEqual([1, 0.333, 0, 0, 0, 0, 0, 0, 0]);
});

it('calculates vault size distribution with min', () => {
  const row = getVaultDistribution({ filter, range: { min: 3400 } });
  expect(row).toEqual([0, 0, 0, 0, 0, 0, 0, 0.333, 1]);
});

it('calculates vault size distribution with min and max', () => {
  const row = getVaultDistribution({
    filter,
    range: { min: 2200, max: 2700 }
  });
  expect(row).toEqual([0, 0, 0, 0.333, 1, 0.333, 0, 0, 0]);
});

it('formats vault size texts without range', () => {
  const texts = formatVaultSizeTexts({});
  expect(texts).toEqual({ label: '', title: '' });
});

it('formats vault size texts with min', () => {
  const texts = formatVaultSizeTexts({ min: 0 });
  expect(texts).toEqual({
    title:
      'Percentage of Eyes with Vault size greater or equal than 0 micrometres',
    label: '% 0 < Vault (μm)'
  });
});

it('formats vault size texts with max', () => {
  const texts = formatVaultSizeTexts({ max: 0 });
  expect(texts).toEqual({
    title: 'Percentage of Eyes with Vault size less than 0 micrometres',
    label: '% Vault < 0 (μm)'
  });
});

it('formats vault size texts with min and max', () => {
  const texts = formatVaultSizeTexts({ max: 10, min: 0 });
  expect(texts).toEqual({
    title: 'Percentage of Eyes with Vault size between 0 and 10 micrometres',
    label: '% 0 < Vault < 10 (μm)'
  });
});

it('counts data points by vault range', () => {
  const a = countByVaultRange({
    points: [
      {
        age: 42,
        ata: 1,
        clr: 2,
        iclSe: 3,
        iclSize: 4,
        vault: 5,
        acd: 0,
        cct: 0,
        aca: 0,
        wtw: 0,
        keratometry: 0
      }
    ],
    range: {}
  });
  expect(a).toBe(0);
});
