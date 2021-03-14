import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ICLContainer } from './ICLContainer';

/**
 * Renders the provided JSX element wrapped in the provided route.
 * Inspiration: https://testing-library.com/docs/example-react-router/#reducing-boilerplate
 * @param ui - element to be rendered
 * @param route - route to be used; default: the configured base url
 * @returns
 */
const renderWithRouter = (ui: JSX.Element, route: string = '#') => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

it('renders without crashing', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />);
  expect(asFragment()).toMatchSnapshot();
});

it('resets form when clicking reset button', async () => {
  const { asFragment } = renderWithRouter(<ICLContainer />);
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

it('switches to Biometric Normality tab when clicked', async () => {
  renderWithRouter(<ICLContainer />);

  await waitFor(() => {
    fireEvent.click(screen.getByText('Biometric Normality'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Normality Graphs are coming soon/)).toBeVisible();
});

it('switches to Floating Matrix tab when clicked', async () => {
  renderWithRouter(<ICLContainer />);

  await waitFor(() => {
    fireEvent.click(screen.getByText('Floating Matrix'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Floating Matrix is coming soon/)).toBeVisible();
});

it('switches to Regression tab when clicked', async () => {
  renderWithRouter(<ICLContainer />);

  await waitFor(() => {
    fireEvent.click(screen.getByText('Regression'));
  });

  expect(screen.queryByLabelText('Name')).toBeNull();
  expect(screen.getByText(/Regression is coming soon/)).toBeVisible();
});

it('renders Patient form on # route', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />);
  expect(asFragment()).toMatchSnapshot();
});

it('renders Biometric Normality on #normality route', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />, '#normality');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Floating Matrix on #matrix route', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />, '#matrix');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Regression on #regression route', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />, '#regression');
  expect(asFragment()).toMatchSnapshot();
});

it('renders Patient for inexistent route', () => {
  const { asFragment } = renderWithRouter(<ICLContainer />, '#does-not-exist');
  expect(asFragment()).toMatchSnapshot();
});
