import { fireEvent, render, screen } from '@testing-library/react';

import { NavBar } from './NavBar';

/*
 * Replaces an asFragment() snapshot (#121). The snapshot recorded this
 * component's Bootstrap classes and would move on any restyle; what it was
 * actually protecting is the brand link's href.
 *
 * That href is import.meta.env.BASE_URL, and vite.config.ts pins
 * test.env.BASE_URL to '/icl-calc/' for exactly this reason - vitest 5
 * stopped deriving it from `base`, and recording '/' would have the suite
 * assert a path the shipped app never uses. The snapshot was the only thing
 * asserting it, so deleting it without this test would silently remove the
 * base-path guard the pin exists to enable.
 */
it('points the brand link at the configured base path', () => {
  render(<NavBar resetForm={() => {}} />);

  expect(screen.getByRole('link', { name: 'ICL Size Calc' })).toHaveAttribute(
    'href',
    '/icl-calc/'
  );
});

it('resets the form when the Reset button is clicked', () => {
  let resets = 0;

  render(<NavBar resetForm={() => (resets += 1)} />);

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  expect(resets).toBe(1);
});
