import { Matrix, getNumEyes } from '.';

import TestRenderer from 'react-test-renderer';
import { FILTER as filter } from './data.test';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Matrix ata={11.7} clr={0} />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('calculates number of eyes', () => {
  const eyes = getNumEyes(filter);
  expect(eyes).toEqual([3, 3, 3, 3, 3, 3, 3, 3, 3]);
});
