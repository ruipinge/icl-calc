import {
  VaultDistributionRows,
  countByVaultRange,
  formatVaultSizeTexts,
  getVaultDistribution
} from './VaultDistributionRows';

import { render, screen } from '@testing-library/react';

import { FILTER as filter } from './data.test';
import { readRows } from './components.test';

/*
 * Replaces an asFragment() snapshot (#121). The five vault bands, their
 * boundaries and their order are the clinical content of this table - they
 * are the ranges a surgeon reads a lens choice off - so they are asserted as
 * text rather than left implied by a serialised DOM.
 *
 * An unmatched filter keeps the figures a fixed row of zeros; the
 * distribution arithmetic is asserted by the function tests below against the
 * shared FILTER fixture.
 */
const BANDS = [
  [
    '% Vault < 250 (\u03bcm)',
    'Percentage of Eyes with Vault size less than 250 micrometres'
  ],
  [
    '% 250 < Vault < 500 (\u03bcm)',
    'Percentage of Eyes with Vault size between 250 and 500 micrometres'
  ],
  [
    '% 500 < Vault < 750 (\u03bcm)',
    'Percentage of Eyes with Vault size between 500 and 750 micrometres'
  ],
  [
    '% 750 < Vault < 1000 (\u03bcm)',
    'Percentage of Eyes with Vault size between 750 and 1000 micrometres'
  ],
  [
    '% 1000 < Vault (\u03bcm)',
    'Percentage of Eyes with Vault size greater or equal than 1000 micrometres'
  ]
];

const renderRows = () =>
  render(
    <table>
      <tbody>
        <VaultDistributionRows ata={0} clr={0} />
      </tbody>
    </table>
  );

it('renders the five vault bands, in ascending order', () => {
  renderRows();

  const zeros = Array(9).fill('0');

  expect(readRows()).toEqual(BANDS.map(([label]) => [label, ...zeros]));
});

it('describes each band in full for the abbreviation it shows', () => {
  renderRows();

  BANDS.forEach(([label, title]) => {
    expect(screen.getByRole('rowheader', { name: label })).toHaveAttribute(
      'title',
      title
    );
  });
});

it('calculates vault size distribution with max', () => {
  const row = getVaultDistribution({ filter, range: { max: 1500 } });
  expect(row).toEqual([100, 33.3, 0, 0, 0, 0, 0, 0, 0]);
});

it('calculates vault size distribution with min', () => {
  const row = getVaultDistribution({ filter, range: { min: 3400 } });
  expect(row).toEqual([0, 0, 0, 0, 0, 0, 0, 33.3, 100]);
});

it('calculates vault size distribution with min and max', () => {
  const row = getVaultDistribution({
    filter,
    range: { min: 2200, max: 2700 }
  });
  expect(row).toEqual([0, 0, 0, 33.3, 100, 33.3, 0, 0, 0]);
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
