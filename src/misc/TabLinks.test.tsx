import { render, screen } from '@testing-library/react';

import { HashRouter as Router } from 'react-router-dom';
import { TabLinks } from './TabLinks';

/*
 * Replaces an asFragment() snapshot (#121). Order is asserted explicitly
 * rather than implied by the serialised DOM: the tab order is part of the
 * arrangement #121's layout baseline records, so an accidental reordering
 * during the reskin must fail a test while a restyled tab must not.
 */
const TABS = [
  ['Patient', '#/'],
  ['Biometric Normality', '#/normality'],
  ['Floating Matrix', '#/matrix'],
  ['Regression', '#/regression']
] as const;

it('renders the four tabs, in order, pointing at their routes', () => {
  render(
    <Router>
      <TabLinks />
    </Router>
  );

  const links = screen.getAllByRole('link');

  expect(links).toHaveLength(TABS.length);
  TABS.forEach(([label, href], index) => {
    expect(links[index]).toBe(screen.getByRole('link', { name: label }));
    expect(links[index]).toHaveAttribute('href', href);
  });
});

/*
 * The router is at '/' here, so Patient is the active tab. aria-current is
 * how that reaches assistive technology; the 'active' class is how it
 * reaches the eye, and the class is what the reskin will change.
 */
it('marks only the current tab as current', () => {
  render(
    <Router>
      <TabLinks />
    </Router>
  );

  expect(screen.getByRole('link', { name: 'Patient' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  expect(screen.getByRole('link', { name: 'Regression' })).not.toHaveAttribute(
    'aria-current'
  );
});
