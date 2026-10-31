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
 * The four axis fields used to share the visible label "@" and
 * had to be reached by position. Each is now "<field> axis" (#136), so all
 * nine are addressed by accessible name and the interleaved
 * flat/axis/steep/axis order is pinned by comparing the document order of
 * the spinbuttons against those names.
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
 * A reading is read as "X dpt at Y º", so each keratometry value shares one
 * row with its own axis, joined by a visible "@" that is presentation only.
 */
const READINGS = [
  ['Anterior Keratometry Flat (KAntFlt)', 'Anterior Keratometry Flat axis'],
  ['Anterior Keratometry Steep (KAntStp)', 'Anterior Keratometry Steep axis'],
  ['Posterior Keratometry Flat (KPostFlt)', 'Posterior Keratometry Flat axis'],
  ['Posterior Keratometry Steep (KPostStp)', 'Posterior Keratometry Steep axis']
];

it('puts each keratometry value and its axis on one row', () => {
  const { container } = renderCorneaProfile();

  // the row is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const rows = [...container.querySelectorAll('.krow')];
  expect(rows).toHaveLength(READINGS.length);
  READINGS.forEach(([k, axis], i) => {
    // eslint-disable-next-line testing-library/no-node-access
    expect(rows[i].querySelectorAll('input')).toHaveLength(2);
    expect(rows[i]).toContainElement(
      screen.getByRole('spinbutton', { name: `${k}, dioptres` })
    );
    expect(rows[i]).toContainElement(
      screen.getByRole('spinbutton', { name: `${axis}, degrees` })
    );
  });
});

it('joins each value to its axis with a hidden "@"', () => {
  renderCorneaProfile();

  const ats = screen.getAllByText('@');
  expect(ats).toHaveLength(4);
  ats.forEach((at) => expect(at).toHaveAttribute('aria-hidden', 'true'));
  expect(screen.queryByText('at')).toBeNull();
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

  // by description, not text: the message holds its range in a span of its own
  expect(
    await screen.findByRole('spinbutton', {
      name: 'Posterior Keratometry Flat (KPostFlt), dioptres',
      description: 'Invalid value. [4, 8] or 0 if not measured.'
    })
  ).toBeInTheDocument();
});

/*
 * Each reading carries two controls with near-identical wiring, so a slip
 * that hands one control another's error or touched state renders cleanly
 * and fails nothing else. A control shows its message only when its error
 * and its touched flag both arrive, so each is varied on its own: every
 * field touched with only one invalid catches an error reaching the wrong
 * control, and every field invalid with only one touched catches a touched
 * flag doing so. Either way exactly one control may answer: the field's
 * own, with its message inside its own value cell.
 */
const INVALID = [
  ['kaf', 100, 'Anterior Keratometry Flat (KAntFlt), dioptres'],
  ['axisaf', 200, 'Anterior Keratometry Flat axis, degrees'],
  ['kas', 100, 'Anterior Keratometry Steep (KAntStp), dioptres'],
  ['axisas', 200, 'Anterior Keratometry Steep axis, degrees'],
  ['kpf', -6.2, 'Posterior Keratometry Flat (KPostFlt), dioptres'],
  ['axispf', 200, 'Posterior Keratometry Flat axis, degrees'],
  ['kps', -6.5, 'Posterior Keratometry Steep (KPostStp), dioptres'],
  ['axisps', 200, 'Posterior Keratometry Steep axis, degrees']
] as const;

const ALL_INVALID = Object.fromEntries(
  INVALID.map(([field, value]) => [field, value])
);
const ALL_TOUCHED = Object.fromEntries(INVALID.map(([field]) => [field, true]));

const PASSES = INVALID.flatMap(([field, value, name]) => [
  {
    field,
    name,
    pass: 'only it invalid, every field touched',
    values: { ...VALUES, [field]: value },
    touched: ALL_TOUCHED
  },
  {
    field,
    name,
    pass: 'every field invalid, only it touched',
    values: { ...VALUES, ...ALL_INVALID },
    touched: { [field]: true }
  }
]);

it.each(PASSES)(
  'binds $field to its own control and no other ($pass)',
  async ({ field, name, values, touched }) => {
    renderCorneaProfile(values, {
      initialTouched: { corneaProfile: touched },
      validateOnMount: true
    });

    const target = await screen.findByRole('spinbutton', {
      name,
      description: /Invalid value\./
    });
    expect(target).toHaveAttribute('aria-invalid', 'true');

    // the stylesheet places a message under its control only by this nesting
    // eslint-disable-next-line testing-library/no-node-access
    const cell = target.closest('.mvalue');
    // eslint-disable-next-line testing-library/no-node-access
    const message = document.getElementById(`corneaProfile.${field}-error`);
    expect(cell).toContainElement(message);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelectorAll('.mrow-error')).toHaveLength(1);

    screen
      .getAllByRole('spinbutton')
      .filter((other) => other !== target)
      .forEach((other) => {
        expect(other).not.toHaveAttribute('aria-invalid');
        expect(other).not.toHaveAccessibleDescription();
      });
  }
);
