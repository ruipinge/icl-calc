import { render, screen } from '@testing-library/react';
import { MissingNote } from './MissingNote';

it.each([
  [['AtA'], 'Enter AtA on the Patient tab to see the thing.'],
  [['AtA', 'CLR'], 'Enter AtA and CLR on the Patient tab to see the thing.'],
  [
    ['Date of Birth', 'AtA', 'CLR'],
    'Enter Date of Birth, AtA and CLR on the Patient tab to see the thing.'
  ]
])('lists %j', (missing, text) => {
  render(<MissingNote missing={missing} purpose="the thing" />);
  expect(screen.getByText(text).tagName).toBe('P');
});
