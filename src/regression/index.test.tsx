import TestRenderer, { act } from 'react-test-renderer';
import { RI } from './formulas.test';
import { Regression } from '.';

it('renders without crashing', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Regression {...RI} />);
  });
  expect(renderer!.toJSON()).toMatchSnapshot();
});
