import { RI } from './formulas.test';
import { Regression } from '.';
import TestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Regression {...RI} />).toJSON();
  expect(tree).toMatchSnapshot();
});
