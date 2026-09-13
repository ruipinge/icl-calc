import {
  VaultStatRows,
  getVaultAverages,
  getVaultMaxs,
  getVaultMins
} from './VaultStatRows';

import { render, screen } from '@testing-library/react';

import { FILTER as filter } from './data.test';
import { readRows } from './components.test';

/*
 * Replaces an asFragment() snapshot (#121). The three statistics and their
 * order are what the reskin must not change; the classes the snapshot also
 * recorded are what it will.
 *
 * An unmatched filter is used deliberately, so the rendered figures are a
 * fixed row of zeros rather than data this test would be restating. The
 * arithmetic itself is asserted by the three function tests below, against
 * the shared FILTER fixture.
 */
it('renders average, minimum and maximum vault rows in that order', () => {
  render(
    <table>
      <tbody>
        <VaultStatRows ata={0} clr={0} />
      </tbody>
    </table>
  );

  const zeros = Array(9).fill('0');

  expect(readRows()).toEqual([
    ['Average Vault (\u03bcm)', ...zeros],
    ['Minimum Vault (\u03bcm)', ...zeros],
    ['Maximum Vault (\u03bcm)', ...zeros]
  ]);
});

it('describes each row in full for the abbreviation it shows', () => {
  render(
    <table>
      <tbody>
        <VaultStatRows ata={0} clr={0} />
      </tbody>
    </table>
  );

  ['Average', 'Minimum', 'Maximum'].forEach((stat) => {
    expect(
      screen.getByRole('rowheader', { name: `${stat} Vault (\u03bcm)` })
    ).toHaveAttribute('title', `${stat} Vault size in micrometres`);
  });
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
