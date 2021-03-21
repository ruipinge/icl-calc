import { DividerRow, MatrixRow } from './components';

import { render } from '@testing-library/react';

it('renders DividerRow without crashing', () => {
  const { asFragment } = render(
    <table>
      <tbody>
        <DividerRow />
      </tbody>
    </table>
  );
  expect(asFragment()).toMatchSnapshot();
});

it('renders MatrixRow without crashing', () => {
  const { asFragment } = render(
    <table>
      <tbody>
        <MatrixRow label="Some label" title="Some title" values={[1, 2, 3]} />
      </tbody>
    </table>
  );
  expect(asFragment()).toMatchSnapshot();
});
