import { Normality } from '.';
import TestRenderer from 'react-test-renderer';

// While using amcharts 4 that isn't supported by jest
xit('renders without crashing', () => {
  // const tree =
  TestRenderer.create(
    <Normality ata={11.8} clr={0} acd={4.1} aca={31} wtw={8.6} age={20} />
  ).toJSON();
  //  expect(tree).toMatchSnapshot();
});
