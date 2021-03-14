import { render } from '@testing-library/react';
import { Footer } from './Footer';

it('renders without crashing', () => {
  const { asFragment } = render(<Footer />);
  expect(asFragment()).toMatchSnapshot();
});
