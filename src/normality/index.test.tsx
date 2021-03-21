import { Normality } from '.';
import TestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<Normality />).toJSON();
  expect(tree).toMatchSnapshot();
});
