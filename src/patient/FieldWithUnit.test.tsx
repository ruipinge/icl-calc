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

  expect(screen.getByLabelText('Angle to Angle (AtA)')).toHaveValue(11.7);
});

it('gives the editable input an accessible name', () => {
  renderField();

  expect(
    screen.getByRole('spinbutton', { name: 'Angle to Angle (AtA)' })
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

  expect(screen.getByLabelText('ICL Sphere')).toHaveValue('-8.5');
  expect(screen.getByLabelText('ICL Sphere')).toBeDisabled();
});

/*
 * The unit suffix is a separate element from the input, so the accessible
 * name must not silently absorb it - "Angle to Angle (AtA) mm" would be a
 * different name and would break any caller matching on the label text.
 */
it('keeps the unit suffix out of the accessible name', () => {
  renderField();

  expect(
    screen.queryByRole('spinbutton', { name: /mm/ })
  ).not.toBeInTheDocument();
  expect(screen.getByTitle('millimetres')).toHaveTextContent('mm');
});
