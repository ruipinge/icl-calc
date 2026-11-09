import { afterEach, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

/*
 * Replaces an asFragment() snapshot (#121). Both defines are pinned in test
 * mode by vite.config.ts, so the expected values are fixed.
 */
it('links the build commit so a deployed bundle can be traced to its source', () => {
  render(<Footer />);

  expect(screen.getByRole('link', { name: '(0000000)' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc/commit/0000000'
  );
});

it('links the release the bundle reports', () => {
  render(<Footer />);

  expect(screen.getByRole('link', { name: 'v0.0.t' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc/releases/tag/v0.0.t'
  );
});

it('links the instructions, data and source', () => {
  render(<Footer />);

  expect(screen.getByRole('link', { name: 'Instructions' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc/blob/main/README.md#instructions'
  );
  expect(screen.getByRole('link', { name: 'Data' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc/blob/main/README.md#data'
  );
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc'
  );
});

/*
 * The licence link is the only one that leaves for a new tab, so it is the
 * only one that needs rel="noopener" - a target="_blank" without it hands
 * the opened page a reference back to this one. Asserted because it is a
 * security property that no other test covers and that a reskin rewriting
 * this markup could drop without anything noticing.
 */
it('opens the licence in a new tab without leaking an opener reference', () => {
  render(<Footer />);

  const licence = screen.getByRole('link', { name: 'MIT License' });

  expect(licence).toHaveAttribute('target', '_blank');
  expect(licence).toHaveAttribute('rel', 'license noopener noreferrer');
});

/*
 * The disclaimer is the footer's clinical content rather than decoration:
 * this is a surgical-planning tool published without warranty, and the
 * statement of that is not something a reskin should be free to drop.
 */
it('carries the no-warranty disclaimer', () => {
  render(<Footer />);

  expect(screen.getByText(/without any kind of warranty/)).toBeInTheDocument();
  expect(
    screen.getByText(
      /authors cannot be held responsible for any consequense of its usage/
    )
  ).toBeInTheDocument();
});

/*
 * The Cloudflare preview labels itself instead of linking a release: no tag
 * exists for it, so the releases/tag URL would 404. The commit link stays,
 * because it is what identifies the exact source.
 */
describe('preview build', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP_PREVIEW_LABEL', 'v2.0.0 preview');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows the preview label', () => {
    render(<Footer />);

    expect(screen.getByText('v2.0.0 preview')).toBeInTheDocument();
  });

  it('does not link the label to a release', () => {
    render(<Footer />);

    expect(
      screen.queryByRole('link', { name: 'v2.0.0 preview' })
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.includes('/releases/tag/'))
    ).toHaveLength(0);
  });

  it('still links the commit the preview was built from', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: '(0000000)' })).toHaveAttribute(
      'href',
      'https://github.com/ruipinge/icl-calc/commit/0000000'
    );
  });
});
