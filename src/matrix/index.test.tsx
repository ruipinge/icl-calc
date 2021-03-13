import TestRenderer from 'react-test-renderer';
import { Matrix } from '.';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Matrix />).toJSON();
  expect(tree).toMatchSnapshot();
});
