import { fireEvent, render, screen } from '@testing-library/react';
import { NavBar } from './NavBar';
import { createHash } from 'node:crypto';
import icon from './treeye-header/icon.svg?raw';
import wordmark from './treeye-header/wordmark.svg?raw';

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

/*
 * The mark is the only route back to the group's site while the calculator is
 * hosted apart from it (#122 owner decision; #123 moves it under the Treeye
 * origin and adds real cross-site nav). It is a second link rather than a
 * relabelling of the first, because the first one's href is the base-path
 * guard asserted above and must not move.
 */
it('links the Treeye mark at the group site', () => {
  render(<NavBar resetForm={() => {}} />);

  expect(screen.getByRole('link', { name: 'Treeye' })).toHaveAttribute(
    'href',
    'https://treeye.science/'
  );
});

/*
 * The header must match the treeye.science one exactly (#172), so the symbol
 * and the wordmark are the site's own artwork, not a lookalike. These hashes
 * were taken of the two <svg> lines of the site's built public/index.html at
 * the commit recorded in treeye-header/SOURCE.md. A failure here means the
 * artwork was edited by hand; recopy it from the site instead, and update
 * both the hashes and SOURCE.md.
 */
it('keeps the Treeye artwork byte for byte as the site builds it', () => {
  const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

  expect(sha256(icon)).toBe(
    '5b100380f57b46ed15c52e33835a9f6151ba27b81b458ae94e719001b48fae4c'
  );
  expect(sha256(wordmark)).toBe(
    '2270991db1855754c87c405d040200f737a2ed8c96f156573e9be44a2e19f251'
  );
});

// toContainHTML normalises both sides through the same parser, so this holds
// the rendered link to the verbatim files rather than to a retyped copy.
it('renders the site symbol and wordmark inside the Treeye link', () => {
  render(<NavBar resetForm={() => {}} />);

  const home = screen.getByRole('link', { name: 'Treeye' });

  expect(home).toContainHTML(icon);
  expect(home).toContainHTML(wordmark);
});

// The tool name sits immediately after the logo: it is the page the user is
// on, and the site is its context (#172, difference 2).
it('places the tool name immediately after the Treeye link', () => {
  render(<NavBar resetForm={() => {}} />);

  const links = screen.getAllByRole('link');

  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAccessibleName('Treeye');
  expect(links[1]).toHaveAccessibleName('ICL Size Calc');
});

it('resets the form when the Reset button is clicked', () => {
  let resets = 0;

  render(<NavBar resetForm={() => (resets += 1)} />);

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  expect(resets).toBe(1);
});
