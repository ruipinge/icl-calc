import TestRenderer from 'react-test-renderer';
import { Regression } from '.';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Regression />).toJSON();
  expect(tree).toMatchSnapshot();
});
