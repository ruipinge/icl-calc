import { render, screen } from '@testing-library/react';

import { CorneaProfile } from './CorneaProfile';
import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { PreviousSurgery } from '../types';

const VALUES = {
  kaf: 42.0,
  kas: 43.5,
  axisaf: 90,
  axisas: 180,
  kpf: 6.2,
  kps: 6.5,
  axispf: 90,
  axisps: 180,
  cct: 540,
  previousSurgery: PreviousSurgery.none
};

const renderCorneaProfile = (
  corneaProfile: typeof VALUES = VALUES,
  extra: Record<string, unknown> = {}
) =>
  render(
    <Formik
      initialValues={{ corneaProfile }}
      validationSchema={ICLSchema}
      onSubmit={() => {}}
      {...extra}
    >
      {({ errors, touched, values, resetForm, ...otherProps }) => (
        <CorneaProfile
          errors={extra.initialTouched ? errors : {}}
          values={values}
          touched={extra.initialTouched ? touched : {}}
          {...otherProps}
        />
      )}
    </Formik>
  );

/*
 * Replaces an asFragment() snapshot (#121). Field order and grouping are the
 * part of this form the reskin must not change, so they are asserted here.
 *
 * The four axis fields used to share the label "@" and had to be reached by
 * position. Each is now "<field> axis" (#136), so all nine are addressed by
 * accessible name and the interleaved flat/axis/steep/axis order is pinned by
 * comparing the document order of the spinbuttons against those names.
 */
const NINE_FIELDS = [
  'Anterior Keratometry Flat (KAntFlt), dioptres',
  'Anterior Keratometry Flat axis, degrees',
  'Anterior Keratometry Steep (KAntStp), dioptres',
  'Anterior Keratometry Steep axis, degrees',
  'Posterior Keratometry Flat (KPostFlt), dioptres',
  'Posterior Keratometry Flat axis, degrees',
  'Posterior Keratometry Steep (KPostStp), dioptres',
  'Posterior Keratometry Steep axis, degrees',
  'Central Corneal Thickness (CCT), micrometres'
];

it('renders the nine fields in flat/axis, steep/axis order, ending with CCT', () => {
  renderCorneaProfile();

  const found = screen.getAllByRole('spinbutton');

  expect(found).toHaveLength(NINE_FIELDS.length);
  NINE_FIELDS.forEach((name, i) =>
    expect(found[i]).toBe(screen.getByRole('spinbutton', { name }))
  );
});

it('shows the values it was given', () => {
  renderCorneaProfile();

  const inputs = screen.getAllByRole('spinbutton');

  expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
    '42',
    '90',
    '43.5',
    '180',
    '6.2',
    '90',
    '6.5',
    '180',
    '540'
  ]);
});

/*
 * The units are clinical meaning, not decoration: a keratometry value in
 * dioptres and one in millimetres are different numbers for the same cornea.
 * The abbreviation on screen is aria-hidden; the full unit is part of each
 * field's accessible name, asserted for all nine in the order test above and
 * here for the abbreviation a sighted clinician reads.
 */
it('shows the unit abbreviation beside each value', () => {
  renderCorneaProfile();

  const dioptres = screen.getAllByText('dpt');
  const degrees = screen.getAllByText('º');
  const micrometres = screen.getAllByText('μm');

  expect(dioptres).toHaveLength(4);
  expect(degrees).toHaveLength(4);
  expect(micrometres).toHaveLength(1);
  [...dioptres, ...degrees, ...micrometres].forEach((unit) =>
    expect(unit).toHaveAttribute('aria-hidden', 'true')
  );
});

/*
 * asFragment() serialised markup only; React sets a <select>'s selection as a
 * DOM property, so this value was otherwise unverified at every layer.
 */
it('selects the previous-surgery option it was given', () => {
  renderCorneaProfile();

  expect(
    screen.getByLabelText('Previous Corneal Refractive Surgery')
  ).toHaveValue('None');
});

/*
 * The four posterior fields already pass error/touched down to
 * FieldWithUnit, so no wiring was needed for #41 - but "already wired" was
 * worth proving rather than assuming: until ICLSchema constrained them there
 * was nothing for that wiring to carry, and a negative posterior K reached
 * calcRadiusPosterior unchallenged.
 */
it('shows a validation error for a negative posterior keratometry', async () => {
  renderCorneaProfile(
    // As reported, signed, by several biometers.
    { ...VALUES, kpf: -6.2 },
    {
      initialTouched: { corneaProfile: { kpf: true } },
      validateOnMount: true
    }
  );

  expect(
    await screen.findByText('Invalid value. [4, 8] or 0 if not measured.')
  ).toBeInTheDocument();
});
