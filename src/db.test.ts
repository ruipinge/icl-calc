import { DATA_POINTS } from './db';

it('validates data length', () => {
  expect(DATA_POINTS.length).toBe(372);
});

it('validates data integrity', () => {
  DATA_POINTS.forEach((point) => {
    expect(point.ata).not.toBe(NaN);
    expect(point.clr).not.toBe(NaN);
    expect(point.iclSe).not.toBe(NaN);
    expect(point.iclSize).not.toBe(NaN);
    expect(point.vault).not.toBe(NaN);
  });
});
