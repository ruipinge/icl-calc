import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { Info } from './Info';
import { PatientInfo } from '../types';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  // 2020-07-01
  const spy = vi.spyOn(Date, 'now').mockImplementation(() => 1593561600000);

  const { asFragment, getByLabelText } = render(
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
  expect(asFragment()).toMatchSnapshot();

  // asFragment() serialises markup only; React sets a <select>'s selection
  // as a DOM property, so left/right correctness is otherwise unverified
  // at every layer (see docs/modernization-findings.md). Assert it directly.
  expect(getByLabelText('Eye')).toHaveValue('right');

  spy.mockRestore();
});
