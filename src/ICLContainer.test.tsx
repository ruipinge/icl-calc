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

it('renders without crashing', () => {
  const { asFragment } = renderWithHash();
  expect(asFragment()).toMatchSnapshot();
});

it('resets form when clicking reset button', async () => {
  const { asFragment } = renderWithHash();
  expect(asFragment()).toMatchSnapshot();

  await waitFor(() => {
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Blake' }
    });
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
    'Blake'
  );
  expect(asFragment()).toMatchSnapshot();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Reset'));
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
  expect(asFragment()).toMatchSnapshot();
});

// While using amcharts 4 that isn't supported by jest
it.skip('switches to Biometric Normality tab when clicked', async () => {
  renderWithHash();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Biometric Normality'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Normality Graphs are coming soon/)).toBeVisible();
});

it('switches to Floating Matrix tab when clicked', async () => {
  renderWithHash();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Floating Matrix'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Number of Eyes/)).toBeVisible();
});

it('switches to Regression tab when clicked', async () => {
  renderWithHash();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Regression'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Vault Prediction/)).toBeVisible();
  expect(screen.getByText(/Probability of 250 < Vault < 1000/)).toBeVisible();
});

it('renders Patient form on # route', () => {
  const { asFragment } = renderWithHash();
  expect(asFragment()).toMatchSnapshot();
});

// While using amcharts 4 that isn't supported by jest
it.skip('renders Biometric Normality on #normality route', () => {
  const { asFragment } = renderWithHash('#normality');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Floating Matrix on #matrix route', () => {
  const { asFragment } = renderWithHash('#matrix');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Regression on #regression route', () => {
  const { asFragment } = renderWithHash('#regression');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Patient for inexistent route', () => {
  const { asFragment } = renderWithHash('#does-not-exist');
  expect(asFragment()).toMatchSnapshot();
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
  ['#regression', /Vault Prediction/]
])('resolves the legacy %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each([
  ['#/matrix', /Number of Eyes/],
  ['#/regression', /Vault Prediction/]
])('resolves the current %s URL to its tab', (hash, expected) => {
  renderWithHash(hash);
  expect(screen.getByText(expected)).toBeVisible();
  expect(screen.queryByLabelText('Name')).toBeNull();
});

it.each(['#', '#/', ''])('resolves %s to the Patient tab', (hash) => {
  renderWithHash(hash || '/');
  expect(screen.getByLabelText('Name')).toBeVisible();
});
