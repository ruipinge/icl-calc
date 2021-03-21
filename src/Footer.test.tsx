import { Footer } from './Footer';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(<Footer />);
  expect(asFragment()).toMatchSnapshot();
});
