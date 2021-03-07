import ReactDOM from 'react-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ICLContainer } from './ICLContainer';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ICLContainer />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('re-renders ICLForm on reset button click (testing-library)', async () => {
  render(<ICLContainer />);

  await waitFor(() => {
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John' }
    });
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
    'John'
  );

  await waitFor(() => {
    fireEvent.click(screen.getByText('Reset'));
  });

  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
});
