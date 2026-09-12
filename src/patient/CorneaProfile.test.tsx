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
 * part of this form the reskin must not change, so they are asserted here
 * rather than left implied by a serialised DOM that also encodes every
 * Bootstrap class the reskin will move.
 *
 * The four axis fields all carry the label "@", so they are not individually
 * addressable by accessible name - four controls sharing one name is a real
 * weakness, but it is pre-existing and out of scope here (#121 changes no
 * rendering). They are reached positionally instead, which is why this test
 * pins the interleaved flat/axis/steep/axis order explicitly: that
 * arrangement is what makes "@" legible on screen, and it is exactly what a
 * reskin could rearrange without any other test noticing.
 */
it('renders the nine fields in flat/axis, steep/axis order, ending with CCT', () => {
  renderCorneaProfile();

  const inputs = screen.getAllByRole('spinbutton');
  const axes = screen.getAllByLabelText('@');

  expect(inputs).toHaveLength(9);
  expect(axes).toHaveLength(4);

  expect(inputs[0]).toBe(
    screen.getByLabelText('Anterior Keratometry Flat (KAntFlt)')
  );
  expect(inputs[1]).toBe(axes[0]);
  expect(inputs[2]).toBe(
    screen.getByLabelText('Anterior Keratometry Steep (KAntStp)')
  );
  expect(inputs[3]).toBe(axes[1]);
  expect(inputs[4]).toBe(
    screen.getByLabelText('Posterior Keratometry Flat (KPostFlt)')
  );
  expect(inputs[5]).toBe(axes[2]);
  expect(inputs[6]).toBe(
    screen.getByLabelText('Posterior Keratometry Steep (KPostStp)')
  );
  expect(inputs[7]).toBe(axes[3]);
  expect(inputs[8]).toBe(
    screen.getByLabelText('Central Corneal Thickness (CCT)')
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
 * The suffix carries the full unit name as its title for the abbreviation
 * shown on screen.
 */
it('labels each value with its unit', () => {
  renderCorneaProfile();

  expect(screen.getAllByTitle('dioptres')).toHaveLength(4);
  expect(screen.getAllByTitle('degrees')).toHaveLength(4);
  expect(screen.getByTitle('micrometres')).toHaveTextContent('μm');
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
