import { render, screen } from '@testing-library/react';

import { Formik } from 'formik';
import { ICLSchema } from '../ICLSchema';
import { Info } from './Info';
import { PatientInfo } from '../types';

/*
 * Replaces an asFragment() snapshot (#121). The snapshot serialised this
 * form's Bootstrap grid classes, which the reskin moves, alongside the field
 * order and labels, which it must not. Only the second kind is asserted here,
 * so a restyled input passes and a reordered form fails.
 */
const renderInfo = () => {
  // 2020-07-01, so the 2000-07-01 date of birth below is exactly 20.
  const spy = vi.spyOn(Date, 'now').mockImplementation(() => 1593561600000);

  render(
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

  spy.mockRestore();
};

it('is headed Information', () => {
  renderInfo();

  expect(
    screen.getByRole('heading', { name: 'Information' })
  ).toBeInTheDocument();
});

it('renders Name, Date of Birth and Age in that order', () => {
  renderInfo();

  const inputs = screen.getAllByRole('textbox');

  expect(inputs).toHaveLength(3);
  expect(inputs[0]).toBe(screen.getByLabelText('Name'));
  expect(inputs[1]).toBe(screen.getByLabelText('Date of Birth'));
  expect(inputs[2]).toBe(screen.getByLabelText('Age'));
});

it('shows the values it was given', () => {
  renderInfo();

  expect(screen.getByLabelText('Name')).toHaveValue('Pedro Duarte');
  expect(screen.getByLabelText('Date of Birth')).toHaveValue('2000-07-01');
});

/*
 * Age is computed from the date of birth against Date.now(), not entered, so
 * it is disabled. Its value is the one thing in this component that is a
 * calculation rather than an echo.
 */
it('derives Age from the date of birth and disables it', () => {
  renderInfo();

  expect(screen.getByLabelText('Age')).toHaveValue('20');
  expect(screen.getByLabelText('Age')).toBeDisabled();
  expect(screen.getByTitle('years')).toHaveTextContent('years');
});

/*
 * asFragment() serialised markup only; React sets a <select>'s selection as a
 * DOM property, so left/right correctness was unverified at every layer (see
 * docs/modernization-findings.md). That is why this assertion predates the
 * conversion, and why it survives it.
 */
it('offers both eyes and selects the one it was given', () => {
  renderInfo();

  expect(screen.getByLabelText('Eye')).toHaveValue('right');
  expect(
    screen.getAllByRole('option').map((option) => option.textContent)
  ).toEqual(['Select...', 'Left', 'Right']);
});
