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
 * Fields are pinned by id rather than by label because the Patient tab
 * carries duplicate accessible names - Sphere, Cylindre and Axis appear in
 * both Spectacle Refraction and ICL Power, and the four Cornea Profile axis
 * fields are all labelled "@" - so labels alone cannot address them
 * unambiguously. The ids are `${formikName}field`, so pinning them also pins
 * the Formik binding, and they are not presentational.
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
  'biometry.atafield',
  'biometry.wtwfield',
  'biometry.clrfield',
  'biometry.acdfield',
  'biometry.acanfield',
  'biometry.acatfield',
  'corneaProfile.kaffield',
  'corneaProfile.axisaffield',
  'corneaProfile.kasfield',
  'corneaProfile.axisasfield',
  'corneaProfile.kpffield',
  'corneaProfile.axispffield',
  'corneaProfile.kpsfield',
  'corneaProfile.axispsfield',
  'corneaProfile.cctfield',
  'spectacleRefraction.spherefield',
  'spectacleRefraction.cylindrefield',
  'spectacleRefraction.axisfield',
  'spectacleRefraction.vertexfield'
];

/* Computed by the calculator: Age, then the four ICL Power outputs. */
const COMPUTED_FIELDS = [
  'fieldAge',
  'iclSpherefield',
  'iclCylindrefield',
  'iclAxisfield',
  'iclSphericalEquivalentfield'
];

const ids = (role: string) =>
  screen.getAllByRole(role).map((element) => element.getAttribute('id'));

it('lays the Patient tab out in five sections, in order', () => {
  renderWithHash();

  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(
    PATIENT_SECTIONS
  );
});

it('renders every entered measurement, in order', () => {
  renderWithHash();

  expect(ids('spinbutton')).toEqual(MEASURED_FIELDS);
});

/*
 * The computed fields are disabled, which is the whole distinction: a
 * clinician must not be able to type over a number the calculator derived.
 * They are plain text inputs rather than number inputs for the same reason,
 * which is why they appear here and not in MEASURED_FIELDS.
 */
it('renders the computed outputs after the free-text fields, all disabled', () => {
  renderWithHash();

  const textboxes = screen.getAllByRole('textbox');

  expect(textboxes.map((element) => element.getAttribute('id'))).toEqual([
    'fieldName',
    'fieldDateOfBirth',
    ...COMPUTED_FIELDS
  ]);

  // Name and Date of Birth are entered; everything after them is derived.
  // Queried positionally rather than by accessible name because ICL Power
  // repeats Sphere, Cylindre and Axis from Spectacle Refraction.
  textboxes.slice(2).forEach((element) => expect(element).toBeDisabled());
  expect(textboxes[0]).toBeEnabled();
});

it('offers the eye and previous-surgery choices as selects', () => {
  renderWithHash();

  expect(ids('combobox')).toEqual([
    'fieldEye',
    'corneaProfile.previousSurgery'
  ]);
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
  fireEvent.change(screen.getByLabelText('Angle to Angle (AtA)'), {
    target: { value: '12.3' }
  });

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
  expect(screen.getByLabelText('Angle to Angle (AtA)')).toHaveValue(12.3);

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  await waitFor(() => {
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });
  expect(screen.getByLabelText('Angle to Angle (AtA)')).toHaveValue(0);
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
