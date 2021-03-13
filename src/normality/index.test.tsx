import TestRenderer from 'react-test-renderer';
import { Normality } from '.';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Normality />).toJSON();
  expect(tree).toMatchSnapshot();
});
