import TestRenderer, { act } from 'react-test-renderer';
import { CorneaProfile } from './CorneaProfile';
import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { PreviousSurgery } from '../types';

it('renders without crashing', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
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
  });
  expect(renderer!.toJSON()).toMatchSnapshot();
});
