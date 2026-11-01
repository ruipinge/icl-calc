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
  'KAntFlt (dpt), Anterior Keratometry Flat, dioptres',
  'Anterior Keratometry Flat axis, degrees',
  'KAntStp (dpt), Anterior Keratometry Steep, dioptres',
  'Anterior Keratometry Steep axis, degrees',
  'KPostFlt (dpt), Posterior Keratometry Flat, dioptres',
  'Posterior Keratometry Flat axis, degrees',
  'KPostStp (dpt), Posterior Keratometry Steep, dioptres',
  'Posterior Keratometry Steep axis, degrees',
  'CCT (μm), Central Corneal Thickness, micrometres'
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
  [
    'KAntFlt (dpt), Anterior Keratometry Flat',
    'Anterior Keratometry Flat axis'
  ],
  [
    'KAntStp (dpt), Anterior Keratometry Steep',
    'Anterior Keratometry Steep axis'
  ],
  [
    'KPostFlt (dpt), Posterior Keratometry Flat',
    'Posterior Keratometry Flat axis'
  ],
  [
    'KPostStp (dpt), Posterior Keratometry Steep',
    'Posterior Keratometry Steep axis'
  ]
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
 * Each is on screen in the field's label, "KAntFlt (dpt)", over the full name
 * as a caption (#192); an axis, labelled only "@", has its unit as a mark
 * after it. All of it is aria-hidden: the full unit is part of each field's
 * accessible name, asserted for all nine in the order test above.
 */
const SHOWN = [
  ['KAntFlt (dpt)', 'Anterior Keratometry Flat'],
  ['KAntStp (dpt)', 'Anterior Keratometry Steep'],
  ['KPostFlt (dpt)', 'Posterior Keratometry Flat'],
  ['KPostStp (dpt)', 'Posterior Keratometry Steep'],
  ['CCT (μm)', 'Central Corneal Thickness']
];

it('shows each short name with its unit, over its full name', () => {
  renderCorneaProfile();

  SHOWN.forEach(([label, caption]) => {
    const shown = screen.getByText(label);
    expect(shown).toHaveAttribute('aria-hidden', 'true');
    // eslint-disable-next-line testing-library/no-node-access
    expect(shown.closest('label')).toContainElement(screen.getByText(caption));
  });
});

it('marks the unit after each axis, and nowhere else', () => {
  renderCorneaProfile();

  const degrees = screen.getAllByText('º');
  expect(degrees).toHaveLength(4);
  degrees.forEach((unit) => {
    expect(unit).toHaveAttribute('aria-hidden', 'true');
    // the axis's input is the cell before its unit
    // eslint-disable-next-line testing-library/no-node-access
    expect(unit.previousElementSibling).toHaveAttribute(
      'name',
      expect.stringMatching(/^corneaProfile\.axis/)
    );
  });
  expect(screen.queryByText('dpt')).toBeNull();
  expect(screen.queryByText('μm')).toBeNull();
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
      name: 'KPostFlt (dpt), Posterior Keratometry Flat, dioptres',
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
 * own, with its message in its own row, opening with the name of the
 * control it is about - "K: " for a reading, "Axis: " for its axis.
 */
const INVALID = [
  ['kaf', 100, 'KAntFlt (dpt), Anterior Keratometry Flat, dioptres'],
  ['axisaf', 200, 'Anterior Keratometry Flat axis, degrees'],
  ['kas', 100, 'KAntStp (dpt), Anterior Keratometry Steep, dioptres'],
  ['axisas', 200, 'Anterior Keratometry Steep axis, degrees'],
  ['kpf', -6.2, 'KPostFlt (dpt), Posterior Keratometry Flat, dioptres'],
  ['axispf', 200, 'Posterior Keratometry Flat axis, degrees'],
  ['kps', -6.5, 'KPostStp (dpt), Posterior Keratometry Steep, dioptres'],
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

    // the stylesheet places a message under its row only by this nesting
    // eslint-disable-next-line testing-library/no-node-access
    const row = target.closest('.mrow');
    // eslint-disable-next-line testing-library/no-node-access
    const message = document.getElementById(`corneaProfile.${field}-error`);
    expect(row).toContainElement(message);
    // eslint-disable-next-line testing-library/no-node-access
    const shown = document.querySelectorAll('.mrow-error');
    expect(shown).toHaveLength(1);
    expect(shown[0]).toHaveTextContent(
      new RegExp(
        `^${field.startsWith('axis') ? 'Axis' : 'K'}: Invalid value\\.`
      )
    );

    screen
      .getAllByRole('spinbutton')
      .filter((other) => other !== target)
      .forEach((other) => {
        expect(other).not.toHaveAttribute('aria-invalid');
        expect(other).not.toHaveAccessibleDescription();
      });
  }
);
