import { Matrix, getNumEyes } from '.';

import TestRenderer, { act } from 'react-test-renderer';
import { FILTER as filter } from './data.test';

it('renders without crashing', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Matrix ata={11.7} clr={0} />);
  });
  expect(renderer!.toJSON()).toMatchSnapshot();
});

it('calculates number of eyes', () => {
  const eyes = getNumEyes(filter);
  expect(eyes).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3]);
});
