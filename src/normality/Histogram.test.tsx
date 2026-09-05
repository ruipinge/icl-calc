import { render, screen } from '@testing-library/react';
import { HISTOGRAM_DATA } from '../db';
import { Histogram } from './Histogram';

it('draws one bar per bin', () => {
  const { container } = render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(container.querySelectorAll('[data-testid="bar"]')).toHaveLength(10);
});

it('renders the title', () => {
  render(
    <Histogram title="Angle to Angle - AtA (mm)" data={HISTOGRAM_DATA.ata} />
  );
  expect(screen.getByText('Angle to Angle - AtA (mm)')).toBeInTheDocument();
});
