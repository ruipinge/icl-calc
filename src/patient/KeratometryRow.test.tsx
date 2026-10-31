import { render, screen } from '@testing-library/react';

import { Formik } from 'formik';
import { KeratometryRow } from './KeratometryRow';

/*
 * A keratometry reading is read as "X dpt at Y º": the value and its axis
 * share one row of the Cornea Profile grid. Each control keeps its own
 * accessible name; the visible "at" is presentation only.
 */
const renderRow = (props: Partial<Parameters<typeof KeratometryRow>[0]> = {}) =>
  render(
    <Formik
      initialValues={{ corneaProfile: { kaf: 42, axisaf: 90 } }}
      onSubmit={() => {}}
    >
      <KeratometryRow
        label="Anterior Keratometry Flat (KAntFlt)"
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
      name: 'Anterior Keratometry Flat (KAntFlt), dioptres'
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

it('shows "at" before the axis, hidden from the accessibility tree', () => {
  renderRow();

  expect(screen.getByText('at')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByText('@')).toBeNull();
});

/*
 * The stylesheet places the six cells on one grid line only if they are
 * siblings in reading order: label, K, dpt, at, axis, º. A message between
 * them would span the row and push the axis onto a line of its own.
 */
const cellText = (el: Element) => {
  if (el.tagName === 'INPUT') {
    return `input:${el.getAttribute('name')}`;
  }
  // a label's visible text is its aria-hidden span; the sr-only name follows
  // eslint-disable-next-line testing-library/no-node-access
  const visible = el.querySelector('[aria-hidden]') ?? el;
  return `${el.tagName.toLowerCase()}:${visible.textContent}`;
};

it('lays the reading and its axis out as one row, messages last', () => {
  const { container } = renderRow({
    error: 'Bad K',
    touched: true,
    axisError: 'Bad axis',
    axisTouched: true
  });

  // the row's cell order is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const rows = container.querySelectorAll('.mrow');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toHaveClass('krow');
  // eslint-disable-next-line testing-library/no-node-access
  const cells = [...rows[0].children].map((el) => cellText(el));
  expect(cells).toEqual([
    'label:Anterior Keratometry Flat (KAntFlt)',
    'input:corneaProfile.kaf',
    'span:dpt',
    'label:at',
    'input:corneaProfile.axisaf',
    'span:º',
    'div:Bad K',
    'div:Bad axis'
  ]);
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
