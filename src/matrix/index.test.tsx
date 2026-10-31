import { Matrix, getNumEyes } from '.';
import { render, screen, within } from '@testing-library/react';

import { FILTER as filter } from './data.test';
import { readRows } from './components.test';

/*
 * Replaces an asFragment() snapshot (#121). What this table has to keep
 * through the reskin is its shape: a lens-size header band above a myopia
 * band, then Number of Eyes, the three vault statistics and the five
 * distribution bands, separated by dividers. That arrangement is asserted
 * here; the Bootstrap classes the snapshot also recorded are not.
 *
 * The per-cell arithmetic is not restated - it is covered by the function
 * tests in VaultStatRows, VaultDistributionRows and data, and end to end by
 * the golden master. Two concrete figures are pinned instead, because they
 * are what ties this rendering to the real dataset rather than to itself:
 * the Number of Eyes row and the matching-eyes total.
 */
const renderMatrix = () => render(<Matrix ata={11.7} clr={0} />);

it('stacks a lens-size header band above a myopia band', () => {
  renderMatrix();

  const [lensRow, myopiaRow] = readRows();

  expect(lensRow).toEqual(['Lens Size', '12.6 mm', '13.2 mm', '13.7 mm']);
  expect(myopiaRow).toEqual([
    'Myopia',
    'Low',
    'Moderate',
    'High',
    'Low',
    'Moderate',
    'High',
    'Low',
    'Moderate',
    'High'
  ]);
});

it('lists the body rows in order, separated by dividers', () => {
  renderMatrix();

  expect(
    readRows()
      .slice(2)
      .map((row) => row[0])
  ).toEqual([
    'Number of Eyes',
    '',
    'Average Vault (μm)',
    'Minimum Vault (μm)',
    'Maximum Vault (μm)',
    '',
    '% Vault < 250 (μm)',
    '% 250 < Vault < 500 (μm)',
    '% 500 < Vault < 750 (μm)',
    '% 750 < Vault < 1000 (μm)',
    '% 1000 < Vault (μm)'
  ]);
});

/*
 * Nine data columns, one per myopia level within each lens size. A row that
 * lost a column would still render, and every other assertion here would
 * still pass.
 */
it('gives every data row one cell per lens-size and myopia combination', () => {
  renderMatrix();

  const dataRows = readRows()
    .slice(2)
    .filter((row) => row[0] !== '');

  expect(dataRows).toHaveLength(9);
  dataRows.forEach((row) => expect(row).toHaveLength(10));
});

it('counts the eyes matching each column for the real dataset', () => {
  renderMatrix();

  expect(readRows()[2]).toEqual([
    'Number of Eyes',
    '0',
    '5',
    '6',
    '0',
    '8',
    '6',
    '0',
    '0',
    '0'
  ]);
});

it('reports the filter it was given and the matching share of the dataset', () => {
  renderMatrix();

  expect(
    screen.getAllByRole('listitem').map((item) => item.textContent)
  ).toEqual([
    'Angle to Angle (AtA): 11.7 mm.',
    'Crystaline Lens Rise (CLR): 0 mm.',
    'Number of matching Eyes: 25/542.'
  ]);
});

it('calculates number of eyes', () => {
  const eyes = getNumEyes(filter);
  expect(eyes).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3]);
});

it('wraps the one table in a horizontal scroll region', () => {
  renderMatrix();
  const table = screen.getByRole('table');
  expect(table).toHaveClass('ledger');
  // The wrapper has no role to query by; the parent is the assertion.
  // eslint-disable-next-line testing-library/no-node-access
  expect(table.parentElement).toHaveClass('ledger-scroll');
});

it('marks each lens column group with its size accent', () => {
  renderMatrix();
  expect(screen.getByRole('columnheader', { name: '12.6 mm' })).toHaveClass(
    'lens-small'
  );
  expect(screen.getByRole('columnheader', { name: '13.2 mm' })).toHaveClass(
    'lens-medium'
  );
  expect(screen.getByRole('columnheader', { name: '13.7 mm' })).toHaveClass(
    'lens-large'
  );
});

it('renders an empty lens column as legible zeros with no de-emphasis', () => {
  // Golden row 08-large-lens-bin: 12.6 mm is empty.
  render(<Matrix ata={12.7} clr={200} />);
  const labels = screen
    .getAllByRole('rowheader')
    .map((h) => h.textContent ?? '');
  expect(labels).toHaveLength(9);
  labels.forEach((label) => {
    const cells = within(
      screen.getByRole('row', { name: (name) => name.startsWith(`${label} `) })
    )
      .getAllByRole('cell')
      .slice(0, 3);
    expect(cells).toHaveLength(3);
    cells.forEach((c) => {
      expect(c).toHaveTextContent(/^0$/);
      expect(c.className).toBe('');
    });
  });
});

it('keeps the summary list L2 reads', () => {
  renderMatrix();
  expect(
    within(screen.getByTestId('matrix-summary')).getAllByRole('listitem')
  ).toHaveLength(3);
});

/*
 * #193: a row header that holds numbers is set in the numeric face, like the
 * values beside it. The five vault-range headers do; "Number of Eyes" and the
 * three vault statistics hold none.
 */
it('marks exactly the row headers that hold numbers as numeric', () => {
  renderMatrix();
  const numeric = screen
    .getAllByRole('rowheader')
    .filter((h) => h.classList.contains('numeric'))
    .map((h) => h.textContent);
  expect(numeric).toEqual([
    '% Vault < 250 (μm)',
    '% 250 < Vault < 500 (μm)',
    '% 500 < Vault < 750 (μm)',
    '% 750 < Vault < 1000 (μm)',
    '% 1000 < Vault (μm)'
  ]);
});
