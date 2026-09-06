import { render, screen } from '@testing-library/react';
import { CorneaProfile } from './CorneaProfile';
import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { PreviousSurgery } from '../types';

it('renders without crashing', () => {
  const { asFragment } = render(
    <Formik
      initialValues={{
        corneaProfile: {
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
        }
      }}
      validationSchema={ICLSchema}
      onSubmit={() => {}}
    >
      {({ errors, touched, values, resetForm, ...otherProps }) => (
        <CorneaProfile
          errors={{}}
          values={values}
          touched={{}}
          {...otherProps}
        />
      )}
    </Formik>
  );
  expect(asFragment()).toMatchSnapshot();

  // asFragment() serialises markup only; React sets a <select>'s selection
  // as a DOM property, so this value is otherwise unverified at every layer.
  // The <label> previously had no matching id on the <select> (Formik
  // `Field` doesn't set one on its own), which is what the
  // testing-library/no-node-access lint rule caught here - fixed by giving
  // the Field an explicit id in CorneaProfile.tsx, so getByLabelText now
  // resolves it.
  expect(
    screen.getByLabelText('Previous Corneal Refractive Surgery')
  ).toHaveValue('None');
});

// The four posterior fields already pass `error`/`touched` down to
// FieldWithUnit, so no wiring was needed for #41 - but "already wired" was
// worth proving rather than assuming: until ICLSchema constrained them there
// was nothing for that wiring to carry, and a negative posterior K reached
// calcRadiusPosterior unchallenged.
it('shows a validation error for a negative posterior keratometry', async () => {
  render(
    <Formik
      initialValues={{
        corneaProfile: {
          kaf: 42.0,
          kas: 43.5,
          axisaf: 90,
          axisas: 180,
          // As reported, signed, by several biometers.
          kpf: -6.2,
          kps: 6.5,
          axispf: 90,
          axisps: 180,
          cct: 540,
          previousSurgery: PreviousSurgery.none
        }
      }}
      initialTouched={{ corneaProfile: { kpf: true } }}
      validationSchema={ICLSchema}
      validateOnMount={true}
      onSubmit={() => {}}
    >
      {({ errors, touched, values, resetForm, ...otherProps }) => (
        <CorneaProfile
          errors={errors}
          values={values}
          touched={touched}
          {...otherProps}
        />
      )}
    </Formik>
  );

  expect(
    await screen.findByText('Invalid value. [4, 8] or 0 if not measured.')
  ).toBeInTheDocument();
});
