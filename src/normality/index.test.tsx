import { Normality } from '.';
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { asFragment } = render(
    <Normality ata={11.8} clr={0} acd={4.1} aca={31} wtw={8.6} age={20} />
  );
  expect(asFragment()).toMatchSnapshot();
});
