import { render, screen } from '@testing-library/react';

import { RI } from './formulas.test';
import { Regression } from '.';
import { readRows } from '../matrix/components.test';

/*
 * Replaces an asFragment() snapshot (#121). Both tables are asserted by their
 * headings, column headers and rendered figures, so a restyled table passes
 * and a lost column or a moved lens size does not.
 *
 * The figures are pinned rather than recomputed from the same formulas the
 * component calls, which would assert only that the code agrees with itself.
 * They are the values this fixture produced before the conversion, and the
 * formulas themselves are covered by regression/formulas.test.ts and by the
 * golden master.
 *
 * The row labels in both tbody sections are scope="row" as of #137. They
 * were scope="col" when this file was written, which exposed them as
 * columnheader; readRows collects both roles, so its assertions read the
 * same either way and did not have to change.
 */
const renderRegression = () => render(<Regression {...RI} />);

it('heads the two tables', () => {
  renderRegression();

  expect(
    screen.getByRole('heading', { name: 'Vault Prediction' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: 'Probability of 250 < Vault < 1000 (μm)'
    })
  ).toBeInTheDocument();
});

it('predicts vault and endothelium clearance for each lens size', () => {
  renderRegression();

  expect(readRows().slice(0, 4)).toEqual([
    ['Lens Size', 'Vault (μm)', 'Corneal Endothelium to ICL (mm)'],
    ['12.6 mm', '448.2', '2.74'],
    ['13.2 mm', '709.19', '2.48'],
    ['13.7 mm', '1039.38', '2.15']
  ]);
});

it('gives the probability of a vault in range for each lens size', () => {
  renderRegression();

  expect(readRows().slice(4)).toEqual([
    ['Lens Size', 'Probability (%)'],
    ['12.6 mm', '83.8'],
    ['13.2 mm', '77.7'],
    ['13.7 mm', '11.2']
  ]);
});

/*
 * #137. Both tables marked their tbody row labels scope="col", so a screen
 * reader associated every vault figure with the wrong header axis - the
 * lens size was announced as a column heading for the columns beside it
 * rather than as the row's own label. The DOM snapshots recorded the broken
 * attribute faithfully for years and asserted nothing about it.
 */
it('marks each lens-size cell as its row header, not a column header', () => {
  renderRegression();

  const rowHeaders = screen.getAllByRole('rowheader');

  expect(rowHeaders.map((h) => h.textContent)).toEqual([
    '12.6 mm',
    '13.2 mm',
    '13.7 mm',
    '12.6 mm',
    '13.2 mm',
    '13.7 mm'
  ]);
});
