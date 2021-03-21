import { NavBar } from './NavBar';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(<NavBar resetForm={() => {}} />);
  expect(asFragment()).toMatchSnapshot();
});
