import { ICLInputs, INITIAL_VALUES, PreviousSurgery } from './types';
import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent
} from './formulas';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ICLContainer } from './ICLContainer';

/**
 * ICLContainer renders its own <HashRouter>, so this must NOT wrap it in
 * another router - react-router 7 throws "You cannot render a <Router>
 * inside another <Router>". The old helper wrapped it in <BrowserRouter>,
 * which under v5 was simply ignored (the inner router won) and had been
 * decorative since it was written.
 *
 * Setting window.location.hash is what actually selects the route: the
 * inner HashRouter reads it on mount.
 */
const renderWithHash = (route: string = '#') => {
  window.history.pushState({}, 'Test page', route);
  return render(<ICLContainer />);
};

/* Types into the number input with this accessible name. */
const enterNumber = (name: string, value: string) =>
  fireEvent.change(screen.getByRole('spinbutton', { name }), {
    target: { value }
  });

/*
 * Replaces nine asFragment() snapshots (#121). That fixture was 10,759 lines
 * - 68% of every snapshot line in this repository - and three of the nine
 * rendered the identical thing. It recorded the whole application's markup
 * and asserted nothing about any of it.
 *
 * What it was protecting, and what is asserted here instead, is composition:
 * which sections appear on which tab and in what order, and which fields a
 * clinician enters versus which the calculator computes. Every individual
 * component's own content is covered by its own test file; this one is about
 * arrangement, which is the half of #121's layout baseline that survives the
 * reskin. An accidental reordering in #122 fails here; a restyled control
 * does not.
 *
 * Fields are pinned by accessible name, which is what a clinician (or a
 * screen reader) addresses them by. Sphere, Cylindre and Axis appear in both
 * Spectacle Refraction and ICL Power, and the four Cornea Profile axis
 * fields used to share one label, so each carries a qualifier or a
 * "<field> axis" name that makes it unique (#136, #139).
 */
const PATIENT_SECTIONS = [
  'Information',
  'Biometry',
  'Cornea Profile',
  'Spectacle Refraction',
  'ICL Power'
];

/* Entered by the clinician: every one is a number input. */
const MEASURED_FIELDS = [
  'Angle to Angle (AtA), millimetres',
  'White to White (WtW), millimetres',
  'Crystaline Lens Rise (CLR), micrometres',
  'Internal Anterior Chamber Depth (ACD), millimetres',
  'Anterior Chamber Angle nasal (ACAn), degrees',
  'Anterior Chamber Angle temporal (ACAt), degrees',
  'Anterior Keratometry Flat (KAntFlt), dioptres',
  'Anterior Keratometry Flat axis, degrees',
  'Anterior Keratometry Steep (KAntStp), dioptres',
  'Anterior Keratometry Steep axis, degrees',
  'Posterior Keratometry Flat (KPostFlt), dioptres',
  'Posterior Keratometry Flat axis, degrees',
  'Posterior Keratometry Steep (KPostStp), dioptres',
  'Posterior Keratometry Steep axis, degrees',
  'Central Corneal Thickness (CCT), micrometres',
  'Sphere (spectacle refraction), dioptres',
  'Cylindre (spectacle refraction), dioptres',
  'Axis (spectacle refraction), degrees',
  'Vertex, millimetres'
];

/* Computed by the calculator: Age, then the four ICL Power outputs. */
const COMPUTED_FIELDS = [
  'Age, years',
  'Sphere (ICL power), dioptres',
  'Cylindre (ICL power), dioptres',
  'Axis (ICL power), degrees',
  'Spherical Equivalent (SE), dioptres'
];

/*
 * Pairs each element of `role`, in document order, with the one found by the
 * name expected at that position. A missing, extra, renamed or reordered field
 * leaves a pair that is not the same node. Callers assert identity per pair.
 */
const inOrder = (
  role: 'spinbutton' | 'textbox' | 'combobox',
  names: string[]
) => {
  const found = screen.getAllByRole(role);

  return Array.from(
    { length: Math.max(found.length, names.length) },
    (_, i) => [
      found[i],
      names[i] === undefined
        ? undefined
        : screen.getByRole(role, { name: names[i] })
    ]
  );
};

it('lays the Patient tab out in five sections, in order', () => {
  renderWithHash();

  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(
    PATIENT_SECTIONS
  );
});

it('renders every entered measurement, in order', () => {
  renderWithHash();

  inOrder('spinbutton', MEASURED_FIELDS).forEach(([actual, expected]) =>
    expect(actual).toBe(expected)
  );
});

/*
 * The computed fields are disabled, which is the whole distinction: a
 * clinician must not be able to type over a number the calculator derived.
 * They are plain text inputs rather than number inputs for the same reason,
 * which is why they appear here and not in MEASURED_FIELDS.
 */
it('renders the computed outputs after the free-text fields, all disabled', () => {
  renderWithHash();

  inOrder('textbox', ['Name', 'Date of Birth', ...COMPUTED_FIELDS]).forEach(
    ([actual, expected]) => expect(actual).toBe(expected)
  );

  // Name and Date of Birth are entered; everything after them is derived.
  const textboxes = screen.getAllByRole('textbox');
  textboxes.slice(2).forEach((element) => expect(element).toBeDisabled());
  expect(textboxes[0]).toBeEnabled();
  expect(textboxes[1]).toBeEnabled();
});

it('offers the eye and previous-surgery choices as selects', () => {
  renderWithHash();

  inOrder('combobox', ['Eye', 'Previous Corneal Refractive Surgery']).forEach(
    ([actual, expected]) => expect(actual).toBe(expected)
  );
});

it('shows the six normality charts on their route', () => {
  renderWithHash('#normality');

  expect(screen.getAllByTestId('histogram')).toHaveLength(6);
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it('shows the floating matrix on its route', () => {
  renderWithHash('#matrix');

  expect(
    screen.getByRole('rowheader', { name: 'Number of Eyes' })
  ).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(13);
});

it('shows both regression tables on their route', () => {
  renderWithHash('#regression');

  expect(
    screen.getByRole('heading', { name: 'Vault Prediction' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: 'Probability of 250 < Vault < 1000 (\u03bcm)'
    })
  ).toBeInTheDocument();
});

it('falls back to the Patient tab for an unknown route', () => {
  renderWithHash('#does-not-exist');

  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(
    PATIENT_SECTIONS
  );
});

it('resets every entered value when Reset is clicked', async () => {
  renderWithHash();

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Blake' }
  });
  fireEvent.change(
    screen.getByRole('spinbutton', {
      name: 'Angle to Angle (AtA), millimetres'
    }),
    {
      target: { value: '12.3' }
    }
  );

  // The fireEvent calls above are synchronous DOM events; the waitFor below
  // only asserts (testing-library/no-wait-for-side-effects forbids firing
  // events inside a waitFor callback). It still has to be a waitFor rather
  // than a bare expect: Formik's validateForm runs asynchronously even for a
  // synchronous Yup schema, and this form's fields are one shared schema, so
  // a synchronous assertion would race that in-flight validation and
  // under-exercise the error-display branches in
  // CorneaProfile/Biometry/Refraction/Info that depend on it having resolved
  // (caught as a branch-coverage regression, not a lint failure).
  await waitFor(() => {
    expect(screen.getByLabelText('Name')).toHaveValue('Blake');
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'Angle to Angle (AtA), millimetres'
    })
  ).toHaveValue(12.3);

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  await waitFor(() => {
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });
  // Back to empty, which is where every measured field starts (#196).
  expect(
    screen.getByRole('spinbutton', {
      name: 'Angle to Angle (AtA), millimetres'
    })
  ).toHaveValue(null);
});

it('switches to Biometric Normality tab when clicked', async () => {
  renderWithHash();

  fireEvent.click(screen.getByText('Biometric Normality'));

  await waitFor(() => {
    expect(screen.getByText('Angle to Angle - AtA (mm)')).toBeVisible();
  });
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it('switches to Floating Matrix tab when clicked', async () => {
  renderWithHash();

  fireEvent.click(screen.getByText('Floating Matrix'));

  await waitFor(() => {
    expect(screen.getByText(/Number of Eyes/)).toBeVisible();
  });
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it('switches to Regression tab when clicked', async () => {
  renderWithHash();

  fireEvent.click(screen.getByText('Regression'));

  await waitFor(() => {
    expect(screen.getByText(/Vault Prediction/)).toBeVisible();
  });
  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Probability of 250 < Vault < 1000/)).toBeVisible();
});

/*
 * Tab URLs were #matrix / #normality / #regression under router 5's
 * hashType="noslash", which v7 removed - new links render as #/matrix.
 * Anything a clinician bookmarked before this upgrade is in the old form,
 * so these assert the old form still lands on the right tab.
 *
 * No redirect shim implements this. react-router 7's createHashHistory
 * prefixes a missing leading slash itself, so "#matrix" parses to the
 * pathname "/matrix". These tests hold that library behaviour in place:
 * if a future version drops it, they go red and a shim becomes real work.
 */
it.each([
  ['#matrix', /Number of Eyes/],
  ['#regression', /Vault Prediction/],
  ['#normality', /Angle to Angle - AtA \(mm\)/]
])('resolves the legacy %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each([
  ['#/matrix', /Number of Eyes/],
  ['#/regression', /Vault Prediction/],
  ['#/normality', /Angle to Angle - AtA \(mm\)/]
])('resolves the current %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each(['#', '#/', ''])('resolves %s to the Patient tab', (hash) => {
  renderWithHash(hash || '/');
  expect(screen.getByLabelText('Name')).toBeVisible();
});

describe('Normality gauges with missing ACA or age inputs (#138)', () => {
  const ACA = 'Average Anterior Chamber Angle - ACA (º)';
  const enter = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const enterAngle = enterNumber;
  const gaugeName = (title: string) =>
    screen
      .getByRole('img', { name: (name) => name.startsWith(`${title}: `) })
      .getAttribute('aria-label');
  const goToNormality = () =>
    fireEvent.click(screen.getByText('Biometric Normality'));

  it('names the mean of a full ACA pair', async () => {
    renderWithHash();
    enterAngle('Anterior Chamber Angle nasal (ACAn), degrees', '30');
    enterAngle('Anterior Chamber Angle temporal (ACAt), degrees', '32');
    goToNormality();
    await waitFor(() => {
      expect(gaugeName(ACA)).toMatch(/^Average .*\(º\): 31, /);
    });
  });

  it.each([
    ['temporal', 'Anterior Chamber Angle temporal (ACAt), degrees'],
    ['nasal', 'Anterior Chamber Angle nasal (ACAn), degrees']
  ])('names no ACA when only the %s angle is entered', async (_side, kept) => {
    renderWithHash();
    // The other side is untouched, so still empty (#196).
    enterAngle(kept, '32');
    goToNormality();
    await waitFor(() => {
      expect(gaugeName(ACA)).toBe(`${ACA}: no value entered`);
    });
  });

  it('names no ACA when both angles are cleared', async () => {
    renderWithHash();
    enterAngle('Anterior Chamber Angle nasal (ACAn), degrees', '');
    enterAngle('Anterior Chamber Angle temporal (ACAt), degrees', '');
    goToNormality();
    await waitFor(() => {
      expect(gaugeName(ACA)).toBe(`${ACA}: no value entered`);
    });
  });

  it('names no age when the date of birth is cleared', async () => {
    renderWithHash();
    enter('Date of Birth', '2000-07-01');
    enter('Date of Birth', '');
    goToNormality();
    await waitFor(() => {
      expect(gaugeName('Age (years)')).toBe('Age (years): no value entered');
    });
  });

  it('names an age when the date of birth is valid', async () => {
    renderWithHash();
    enter('Date of Birth', '2000-07-01');
    goToNormality();
    await waitFor(() => {
      expect(gaugeName('Age (years)')).toMatch(/^Age \(years\): \d+, /);
    });
  });
});

/*
 * #196: a fresh form holds no numbers, so nothing is computed from numbers
 * nobody entered. Every measured field starts empty, and so does every
 * output that depends on one.
 */
describe('a fresh form, and the ICL Power it computes (#196)', () => {
  const ICL_POWER_INPUTS: [string, string][] = [
    ['Internal Anterior Chamber Depth (ACD), millimetres', '3.2'],
    ['Anterior Keratometry Flat (KAntFlt), dioptres', '43'],
    ['Anterior Keratometry Steep (KAntStp), dioptres', '44.5'],
    ['Central Corneal Thickness (CCT), micrometres', '540'],
    ['Sphere (spectacle refraction), dioptres', '-10'],
    ['Cylindre (spectacle refraction), dioptres', '-2.25'],
    ['Vertex, millimetres', '12']
  ];

  /* The same seven numbers, as the formulas take them; the rest 0. */
  const ENTERED: ICLInputs = {
    patient: INITIAL_VALUES.patient,
    biometry: { ata: 0, wtw: 0, clr: 0, acd: 3.2, acan: 0, acat: 0 },
    corneaProfile: {
      kaf: 43,
      kas: 44.5,
      kpf: 0,
      kps: 0,
      axisaf: 0,
      axisas: 0,
      axispf: 0,
      axisps: 0,
      cct: 540,
      previousSurgery: PreviousSurgery.none
    },
    spectacleRefraction: { sphere: -10, cylindre: -2.25, axis: 0, vertex: 12 }
  };

  const output = (name: string) =>
    screen.getByRole('textbox', { name: `${name}, dioptres` });
  const outputs = () => [
    output('Sphere (ICL power)'),
    output('Cylindre (ICL power)'),
    output('Spherical Equivalent (SE)')
  ];
  const axisOutput = () =>
    screen.getByRole('textbox', { name: 'Axis (ICL power), degrees' });
  const enter = enterNumber;
  const enterAll = () =>
    ICL_POWER_INPUTS.forEach(([name, value]) => enter(name, value));

  it('starts every measured field empty', () => {
    renderWithHash();

    MEASURED_FIELDS.forEach((name) =>
      expect(screen.getByRole('spinbutton', { name })).toHaveValue(null)
    );
  });

  it('starts Age and all four ICL Power outputs empty', () => {
    renderWithHash();

    expect(screen.getByRole('textbox', { name: 'Age, years' })).toHaveValue('');
    outputs().forEach((element) => expect(element).toHaveValue(''));
    expect(axisOutput()).toHaveValue('');
  });

  it('computes Sphere, Cylindre and SE from the seven fields they read', async () => {
    renderWithHash();
    enterAll();

    await waitFor(() => {
      expect(output('Sphere (ICL power)')).toHaveValue(
        String(calcICLSphere(ENTERED))
      );
    });
    expect(output('Cylindre (ICL power)')).toHaveValue(
      String(calcICLCylindre(ENTERED))
    );
    expect(output('Spherical Equivalent (SE)')).toHaveValue(
      String(calcICLSphericalEquivalent(ENTERED))
    );
    // Axis reads only the refraction axis, which is still empty.
    expect(axisOutput()).toHaveValue('');
  });

  it('computes Axis from the refraction axis alone', async () => {
    renderWithHash();
    enter('Axis (spectacle refraction), degrees', '50');

    await waitFor(() => {
      expect(axisOutput()).toHaveValue(String(calcICLAxis(50)));
    });
    outputs().forEach((element) => expect(element).toHaveValue(''));
  });

  it.each(ICL_POWER_INPUTS.map(([name]) => name))(
    'blanks Sphere, Cylindre and SE when %s is cleared',
    async (name) => {
      renderWithHash();
      enterAll();
      await waitFor(() => {
        expect(output('Sphere (ICL power)')).not.toHaveValue('');
      });

      enter(name, '');

      await waitFor(() => {
        outputs().forEach((element) => expect(element).toHaveValue(''));
      });
    }
  );

  it('shows no error on an untouched field, only on a touched one', async () => {
    renderWithHash();
    // Validates the whole form, so every empty required field now has an
    // error - none touched, so none shown.
    enter('Angle to Angle (AtA), millimetres', '12');
    const wtw = screen.getByRole('spinbutton', {
      name: 'White to White (WtW), millimetres'
    });
    fireEvent.blur(wtw);

    await waitFor(() => {
      expect(wtw).toHaveAttribute('aria-invalid', 'true');
    });
    expect(
      screen
        .getAllByRole('spinbutton')
        .filter((element) => element.hasAttribute('aria-invalid'))
    ).toEqual([wtw]);
    expect(screen.getAllByText(/^Enter a value/)).toHaveLength(1);
  });
});
