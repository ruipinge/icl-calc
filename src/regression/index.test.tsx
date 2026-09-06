import { RI } from './formulas.test';
import { Regression } from '.';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(<Regression {...RI} />);
  expect(asFragment()).toMatchSnapshot();
});
