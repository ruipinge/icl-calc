import { DividerRow, MatrixRow } from './components';
import { LENS_SIZES, MYOPIA_LEVELS } from './data';
import { render, screen, within } from '@testing-library/react';

/*
 * Shared by every table test in this suite (#121). Reads a rendered table
 * into a plain text matrix, so assertions describe row and column structure
 * and the values in it - the things the reskin must not change - without
 * touching the classes and wrappers it will.
 *
 * Headers are merged ahead of cells. Every table in this application puts
 * its header cell first, so that is DOM order; the assertion below makes the
 * assumption loud rather than silent, since a row carrying more than one
 * header alongside cells would otherwise be reordered without anyone
 * noticing.
 */
export const readRows = (): string[][] =>
  screen.getAllByRole('row').map((row) => {
    const headers = [
      ...within(row).queryAllByRole('rowheader'),
      ...within(row).queryAllByRole('columnheader')
    ];
    const cells = within(row).queryAllByRole('cell');

    if (cells.length > 0) {
      expect(headers.length).toBeLessThanOrEqual(1);
    }

    return [...headers, ...cells].map((cell) => cell.textContent ?? '');
  });

const renderInTable = (children: React.ReactNode) =>
  render(
    <table>
      <tbody>{children}</tbody>
    </table>
  );

it('renders a MatrixRow as a labelled row header followed by its values', () => {
  renderInTable(
    <MatrixRow label="Some label" title="Some title" values={[1, 2, 3]} />
  );

  expect(readRows()).toEqual([['Some label', '1', '2', '3']]);
});

/*
 * The title is the row's long-form explanation - "Average Vault size in
 * micrometres" for a header reading "Average Vault (μm)". It is clinical
 * meaning attached to an abbreviation, not decoration.
 */
it('carries the row title as the header description', () => {
  renderInTable(
    <MatrixRow label="Some label" title="Some title" values={[1, 2, 3]} />
  );

  expect(screen.getByRole('rowheader', { name: 'Some label' })).toHaveAttribute(
    'title',
    'Some title'
  );
});

/*
 * The divider spans the whole grid. Its colSpan is the table's column count,
 * so this is the one assertion that pins the matrix's width: one label column
 * plus every myopia level within every lens size.
 */
it('spans the divider across the full width of the matrix', () => {
  renderInTable(<DividerRow />);

  const [row] = readRows();
  expect(row).toEqual(['']);
  expect(screen.getByRole('cell')).toHaveAttribute(
    'colspan',
    String(LENS_SIZES.length * MYOPIA_LEVELS.length + 1)
  );
});
