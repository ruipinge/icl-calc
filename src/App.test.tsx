import { render, screen } from '@testing-library/react';
import App from './App';

it('renders without crashing', () => {
  render(<App />);

  // Previously this test asserted nothing: render() throwing would already
  // fail it, but a component that mounted and rendered blank - or the wrong
  // tab - would still pass. vitest/expect-expect caught the missing
  // assertion; this checks the Patient tab (the default route, per
  // ICLContainer.test.tsx) actually rendered its form.
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
});
