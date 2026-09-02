import { RI } from './formulas.test';
import { Regression } from '.';
import TestRenderer, { act } from 'react-test-renderer';

it('renders without crashing', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Regression {...RI} />);
  });
  expect(renderer!.toJSON()).toMatchSnapshot();
});
