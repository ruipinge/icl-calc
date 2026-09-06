import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

it('renders without crashing', () => {
  const { asFragment } = render(<Footer />);
  expect(asFragment()).toMatchSnapshot();
});

// The snapshot above would accept any commit string, including an empty one.
// This asserts the thing #94 actually needs: that a deployed bundle names the
// commit it was built from, and links somewhere that resolves it. Both defines
// are pinned in test mode by vite.config.ts, so the expected values are fixed.
it('links the build commit so a deployed bundle can be traced to its source', () => {
  render(<Footer />);

  expect(screen.getByRole('link', { name: '(0000000)' })).toHaveAttribute(
    'href',
    'https://github.com/ruipinge/icl-calc/commit/0000000'
  );
});
