import TestRenderer from 'react-test-renderer';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ICLContainer } from './ICLContainer';

it('renders without crashing', () => {
  const tree = TestRenderer.create(<ICLContainer />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('re-renders ICLForm on reset button click (testing-library)', async () => {
  const { asFragment } = render(<ICLContainer />);
  expect(asFragment()).toMatchSnapshot();

  await waitFor(() => {
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Blake' }
    });
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
    'Blake'
  );
  expect(asFragment()).toMatchSnapshot();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Reset'));
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
  expect(asFragment()).toMatchSnapshot();
});
