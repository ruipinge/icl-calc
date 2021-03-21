import { ROWS } from './db';

it('validates data length', () => {
  expect(ROWS.length).toBe(372);
});

it('validates data integrity', () => {
  ROWS.forEach((row) => {
    expect(row.length).toBe(18);
    row.forEach((col) => {
      expect(typeof col).toBe('number');
      expect(col).not.toBe(NaN);
    });
  });
});
