import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { Info } from './Info';
import { PatientInfo } from '../types';
import TestRenderer, { act } from 'react-test-renderer';

it('renders without crashing', () => {
  // 2020-07-01
  const spy = vi.spyOn(Date, 'now').mockImplementation(() => 1593561600000);

  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
    <Formik
      initialValues={{
        patient: new PatientInfo({
          dateOfBirth: '2000-07-01',
          name: 'Pedro Duarte',
          eye: 'right'
        })
      }}
      validationSchema={ICLSchema}
      onSubmit={() => {}}
    >
      {({ errors, touched, values, resetForm, ...otherProps }) => (
        <Info errors={{}} values={values} touched={{}} {...otherProps} />
      )}
    </Formik>
    );
  });
  expect(renderer!.toJSON()).toMatchSnapshot();

  spy.mockRestore();
});
