import { Matrix, getNumEyes } from '.';

import { FILTER as filter } from './data.test';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(<Matrix ata={11.7} clr={0} />);
  expect(asFragment()).toMatchSnapshot();
});

it('calculates number of eyes', () => {
  const eyes = getNumEyes(filter);
  expect(eyes).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3]);
});
