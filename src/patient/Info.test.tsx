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
const renderInfo = (
  shownErrors: Record<string, unknown> = {},
  shownTouched: Record<string, unknown> = {}
) => {
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
        <Info
          errors={shownErrors}
          values={values}
          touched={shownTouched}
          {...otherProps}
        />
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
  expect(inputs[2]).toBe(screen.getByRole('textbox', { name: 'Age (years)' }));
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

  const age = screen.getByRole('textbox', { name: 'Age (years)' });

  expect(age).toHaveValue('20');
  expect(age).toBeDisabled();
});

/*
 * Like every measured value, Age carries its unit in its label (#192), so
 * the visible label is the whole name and there is no unit mark after it.
 */
it('labels Age with its unit, and marks no unit after it', () => {
  renderInfo();

  expect(screen.getByText('Age (years)').tagName).toBe('LABEL');
  expect(screen.queryByText('years')).toBeNull();
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

/*
 * An invalid date of birth is announced, not just coloured: aria-invalid on
 * the control, tied by aria-describedby to the message. Both halves of
 * "error and touched" are required, so an untouched field stays quiet.
 */
const DOB_ERROR = { patient: { dateOfBirth: 'Invalid date' } };

it('marks a touched, invalid date of birth and describes it by its error', () => {
  renderInfo(DOB_ERROR, { patient: { dateOfBirth: true } });

  const dob = screen.getByRole('textbox', { name: 'Date of Birth' });

  expect(dob).toHaveAttribute('aria-invalid', 'true');
  expect(dob).toHaveAccessibleDescription('Invalid date');
});

it('does not mark an invalid date of birth that has not been touched', () => {
  renderInfo(DOB_ERROR, {});

  const dob = screen.getByRole('textbox', { name: 'Date of Birth' });

  expect(dob).not.toHaveAttribute('aria-invalid');
  expect(screen.queryByText('Invalid date')).toBeNull();
});
