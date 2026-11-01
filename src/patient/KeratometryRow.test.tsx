import { render, screen } from '@testing-library/react';

import { Formik } from 'formik';
import { KeratometryRow } from './KeratometryRow';

/*
 * A keratometry reading is read as "X dpt at Y º": the value and its axis
 * share one row of the Cornea Profile grid. Each control keeps its own
 * accessible name; the visible "@" is presentation only.
 */
const renderRow = (props: Partial<Parameters<typeof KeratometryRow>[0]> = {}) =>
  render(
    <Formik
      initialValues={{ corneaProfile: { kaf: 42, axisaf: 90 } }}
      onSubmit={() => {}}
    >
      <KeratometryRow
        label="KAntFlt"
        caption="Anterior Keratometry Flat"
        name="corneaProfile.kaf"
        axisSrLabel="Anterior Keratometry Flat axis"
        axisName="corneaProfile.axisaf"
        {...props}
      />
    </Formik>
  );

it('names the reading in dioptres and its axis in degrees', () => {
  renderRow();

  expect(
    screen.getByRole('spinbutton', {
      name: 'KAntFlt (dpt), Anterior Keratometry Flat, dioptres'
    })
  ).toHaveValue(42);
  expect(
    screen.getByRole('spinbutton', {
      name: 'Anterior Keratometry Flat axis, degrees'
    })
  ).toHaveValue(90);
});

it('keeps the name attributes and ids L2 and the labels address', () => {
  renderRow();

  const [k, axis] = screen.getAllByRole('spinbutton');
  expect(k).toHaveAttribute('name', 'corneaProfile.kaf');
  expect(k).toHaveAttribute('id', 'corneaProfile.kaffield');
  expect(axis).toHaveAttribute('name', 'corneaProfile.axisaf');
  expect(axis).toHaveAttribute('id', 'corneaProfile.axisaffield');
});

it('shows "@" before the axis, hidden from the accessibility tree', () => {
  renderRow();

  expect(screen.getByText('@')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByText('at')).toBeNull();
});

/*
 * The stylesheet places the reading on one grid line only if its cells are
 * siblings in reading order: label, K input, @, axis input, the axis's unit.
 * The K value's unit is in its label. The messages follow the cells as
 * siblings of their own, K first, so each takes a line across the whole
 * row, and each opens with the control it is about.
 */
const cellText = (el: Element): string => {
  if (el.tagName === 'INPUT') {
    return `input:${el.getAttribute('name')}`;
  }
  if (el.classList.contains('mrow-error')) {
    // the prefix a sighted reader sees, then what the control is described by
    // eslint-disable-next-line testing-library/no-node-access
    const prefix = el.querySelector('.mrow-error-field')?.textContent ?? '';
    // eslint-disable-next-line testing-library/no-node-access
    return `message:${prefix}|${el.querySelector('[id]')?.textContent}`;
  }
  // a label's visible text is its aria-hidden span; the sr-only name follows
  // eslint-disable-next-line testing-library/no-node-access
  const visible = el.querySelector('[aria-hidden]') ?? el;
  return `${el.tagName.toLowerCase()}:${visible.textContent}`;
};

const rowCells = (container: HTMLElement) => {
  // the row's cell order is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-node-access
  const rows = container.querySelectorAll('.mrow');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toHaveClass('krow');
  // eslint-disable-next-line testing-library/no-node-access
  return [...rows[0].children].map((el) => cellText(el));
};

it('lays the reading and its axis out as one row, then each message, K first', () => {
  const { container } = renderRow({
    error: 'Bad K',
    touched: true,
    axisError: 'Bad axis',
    axisTouched: true
  });

  expect(rowCells(container)).toEqual([
    'label:KAntFlt (dpt)',
    'input:corneaProfile.kaf',
    'label:@',
    'input:corneaProfile.axisaf',
    'span:º',
    'message:K: |Bad K',
    'message:Axis: |Bad axis'
  ]);
});

it("names an axis message as the axis's alone", () => {
  const { container } = renderRow({ axisError: 'Bad axis', axisTouched: true });

  expect(rowCells(container)).toEqual([
    'label:KAntFlt (dpt)',
    'input:corneaProfile.kaf',
    'label:@',
    'input:corneaProfile.axisaf',
    'span:º',
    'message:Axis: |Bad axis'
  ]);
});

it("names a K message as the reading's alone", () => {
  const { container } = renderRow({ error: 'Bad K', touched: true });

  expect(rowCells(container)).toEqual([
    'label:KAntFlt (dpt)',
    'input:corneaProfile.kaf',
    'label:@',
    'input:corneaProfile.axisaf',
    'span:º',
    'message:K: |Bad K'
  ]);
});

/*
 * A screen reader reading the page line by line meets the two messages
 * without their controls, so the prefix is in the tree and says which is
 * which. It sits outside the element each control is described by, so the
 * description stays the message alone: the control's name already says which.
 */
it('reads each message prefix in the page, but not in the description', () => {
  renderRow({
    error: 'Bad K',
    touched: true,
    axisError: 'Bad axis',
    axisTouched: true
  });

  expect(screen.getByText('K:')).not.toHaveAttribute('aria-hidden');
  expect(screen.getByText('Axis:')).not.toHaveAttribute('aria-hidden');
  const [k, axis] = screen.getAllByRole('spinbutton');
  expect(k).toHaveAccessibleDescription('Bad K');
  expect(axis).toHaveAccessibleDescription('Bad axis');
});

/*
 * A message spans the whole row, the label's track included, so the label
 * no longer spans the message lines (#195). The row is flagged while any of
 * its messages shows, so every cell in it hands its 0.6rem to the messages.
 */
it.each([
  [{}, false],
  [{ error: 'Bad K', touched: true }, true],
  [{ axisError: 'Bad axis', axisTouched: true }, true],
  [
    { error: 'Bad K', touched: true, axisError: 'Bad axis', axisTouched: true },
    true
  ]
])('flags the row while a message shows (%o)', (props, flagged) => {
  const { container } = renderRow(props);

  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const row = container.querySelector('.krow');
  expect(row?.hasAttribute('data-message')).toBe(flagged);
});

/*
 * The reading's label is its short name with the K unit in brackets, over
 * the full name as a caption. The axis has only the "@" on screen, so its
 * unit is a mark after it - hidden, since the axis's name says "degrees".
 */
it('labels the reading with its short name and unit, over its full name', () => {
  renderRow();

  expect(screen.getByText('KAntFlt (dpt)')).toHaveAttribute(
    'aria-hidden',
    'true'
  );
  expect(screen.getByText('Anterior Keratometry Flat')).toHaveClass('mcaption');
});

it('marks the axis unit after the axis, hidden from the tree', () => {
  renderRow();

  const mark = screen.getByText('º');
  expect(mark).toHaveClass('unit');
  expect(mark).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByText('@ (º)')).toBeNull();
});

it('points each invalid, touched control at its own message', () => {
  renderRow({
    error: 'Bad K',
    touched: true,
    axisError: 'Bad axis',
    axisTouched: true
  });

  const [k, axis] = screen.getAllByRole('spinbutton');
  expect(k).toHaveAttribute('aria-invalid', 'true');
  expect(k).toHaveAccessibleDescription('Bad K');
  expect(axis).toHaveAttribute('aria-invalid', 'true');
  expect(axis).toHaveAccessibleDescription('Bad axis');
});

it('shows neither message while untouched', () => {
  renderRow({ error: 'Bad K', axisError: 'Bad axis' });

  expect(screen.queryByText('Bad K')).toBeNull();
  expect(screen.queryByText('Bad axis')).toBeNull();
});
