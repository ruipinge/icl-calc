import TestRenderer from 'react-test-renderer';

import { INITIAL_VALUES } from './patient';
import { ICLForm } from './ICLForm';

it('renders without crashing', () => {
  const tree = TestRenderer.create(
    <ICLForm initialValues={INITIAL_VALUES} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
