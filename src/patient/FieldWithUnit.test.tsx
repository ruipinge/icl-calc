import { render, screen } from '@testing-library/react';

import { FieldWithUnit } from './FieldWithUnit';
import { Formik } from 'formik';

/*
 * Issue #129. FieldWithUnit's <label> carries htmlFor={name + 'field'}, but
 * neither branch of the component set that id, so the label was associated
 * with nothing and 23 of the 27 inputs on the Patient tab announced to a
 * screen reader unlabelled.
 *
 * It went unnoticed for years while being recorded in full: the
 * ICLContainer snapshot serialises 138 for="...field" attributes across its
 * nine renders and asserts nothing about any of them. These tests are the
 * assertion the snapshot never made, so they must query the way an
 * assistive technology resolves a control - by accessible name - and never
 * by id, name or DOM traversal. Querying by id here would pass against a
 * label pointing anywhere at all, which is the original defect.
 */

const renderField = (
  props: Partial<Parameters<typeof FieldWithUnit>[0]> = {}
) =>
  render(
    <Formik initialValues={{ biometry: { ata: 11.7 } }} onSubmit={() => {}}>
      <FieldWithUnit
        label="Angle to Angle (AtA)"
        name="biometry.ata"
        unit="mm"
        {...props}
      />
    </Formik>
  );

it('associates the label with the editable input', () => {
  renderField();

  // getByLabelText matches the label's textContent, which also carries the
  // aria-hidden visible copy, so this anchors on the sr-only name's tail.
  expect(
    screen.getByLabelText(/Angle to Angle \(AtA\), millimetres$/)
  ).toHaveValue(11.7);
});

it('gives the editable input an accessible name', () => {
  renderField();

  expect(
    screen.getByRole('spinbutton', {
      name: 'Angle to Angle (AtA), millimetres'
    })
  ).toHaveValue(11.7);
});

/*
 * The disabled branch is a plain <input>, not a Formik <Field>, and renders
 * a computed result rather than an entry field - ICLPower's four outputs use
 * it. It needs the same association: a value a clinician reads is no less in
 * need of a label than one they type.
 */
it('associates the label with the disabled input', () => {
  renderField({
    label: 'ICL Sphere',
    name: 'iclSphere',
    unit: 'dpt',
    disabled: true,
    value: -8.5
  });

  expect(screen.getByLabelText(/ICL Sphere, dioptres$/)).toHaveValue('-8.5');
  expect(screen.getByLabelText(/ICL Sphere, dioptres$/)).toBeDisabled();
});

it('names the control with its unit, and hides the visible unit from the tree', () => {
  renderField({
    label: 'White to White (WtW)',
    name: 'biometry.wtw',
    unit: 'mm'
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'White to White (WtW), millimetres'
    })
  ).toBeInTheDocument();
  expect(screen.getByText('mm')).toHaveAttribute('aria-hidden', 'true');
});

it('uses srLabel in place of a visible "@"', () => {
  renderField({
    label: '@',
    srLabel: 'Anterior Keratometry Flat axis',
    name: 'corneaProfile.axisaf',
    unit: 'º',
    axisOf: true
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'Anterior Keratometry Flat axis, degrees'
    })
  ).toBeInTheDocument();
  expect(screen.queryByRole('spinbutton', { name: /^@/ })).toBeNull();
});

it('appends the qualifier to the name only', () => {
  renderField({
    label: 'Sphere',
    qualifier: ' (ICL power)',
    name: 'iclSphere',
    unit: 'dpt',
    disabled: true,
    value: -8.5
  });
  expect(
    screen.getByRole('textbox', { name: 'Sphere (ICL power), dioptres' })
  ).toBeDisabled();
  expect(screen.getByText('Sphere')).toBeVisible();
});

it('marks an invalid, touched field and points at its message', () => {
  renderField({
    label: 'AtA',
    name: 'biometry.ata',
    unit: 'mm',
    error: 'Too small',
    touched: true
  });
  const input = screen.getByRole('spinbutton');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Too small');
});

it('references no message when there is no error', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm' });
  const input = screen.getByRole('spinbutton');
  expect(input).not.toHaveAttribute('aria-describedby');
  expect(input).not.toHaveAttribute('aria-invalid');
});

it('keeps the name attribute L2 addresses', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm' });
  expect(screen.getByRole('spinbutton')).toHaveAttribute(
    'name',
    'biometry.ata'
  );
});

it('keeps the id the label points at', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm' });
  expect(screen.getByRole('spinbutton')).toHaveAttribute(
    'id',
    'biometry.atafield'
  );
});

it('renders an axis row as a continuation', () => {
  const { container } = renderField({
    label: '@',
    srLabel: 'Axis',
    name: 'a',
    unit: 'º',
    axisOf: true
  });
  // the row's class is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelector('.mrow')).toHaveClass('axis');
});

it('shows no message for an untouched field', () => {
  renderField({ label: 'AtA', name: 'biometry.ata', unit: 'mm', error: 'Bad' });
  expect(screen.queryByText('Bad')).toBeNull();
});
