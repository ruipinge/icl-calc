import { CorneaProfile } from './CorneaProfile';
import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { PreviousSurgery } from '../types';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment, container } = render(
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
  // The <label> here has no matching id on the <select> (Formik `Field`
  // doesn't set one), so getByLabelText can't resolve it — query by name.
  expect(
    container.querySelector('select[name="corneaProfile.previousSurgery"]')
  ).toHaveValue('None');
});
