import { Regression } from '.';
import TestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Regression />).toJSON();
  expect(tree).toMatchSnapshot();
});
