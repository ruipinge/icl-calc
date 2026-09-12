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
 * Note the row labels in both tbody sections are scope="col", so they expose
 * the columnheader role rather than rowheader. That is a pre-existing
 * mis-scoping, not something this phase changes - it renders nothing
 * differently and #121 touches no markup - but it is why readRows finds them
 * as headers either way.
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
