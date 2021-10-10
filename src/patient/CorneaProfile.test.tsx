import { CorneaProfile } from './CorneaProfile';
import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import TestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(
    <Formik
      initialValues={{
        corneaProfile: {
          kf: 1,
          ks: 2,
          axisf: 3,
          axiss: 4,
          cct: 5
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
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
