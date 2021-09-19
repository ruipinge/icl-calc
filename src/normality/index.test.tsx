import { Normality } from '.';
import TestRenderer from 'react-test-renderer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(
    <Normality ata={11.8} clr={0} acq={4.1} aca={31} wtw={8.6} />
  ).toJSON();
  //  expect(tree).toMatchSnapshot();
});
