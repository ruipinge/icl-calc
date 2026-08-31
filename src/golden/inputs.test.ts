import { GoldenInputs, PINNED_CLOCK_ISO, rowToIclInputs } from './types';

import { ICLSchema } from '../ICLSchema';
import inputsJson from './inputs.json';

const inputs = inputsJson as GoldenInputs;

describe('golden master fixture inputs', () => {
  it('pins the same clock the spec requires', () => {
    expect(inputs.clock).toBe(PINNED_CLOCK_ISO);
  });

  it('has ten rows with unique ids', () => {
    expect(inputs.rows).toHaveLength(10);
    expect(new Set(inputs.rows.map((r) => r.id)).size).toBe(10);
  });

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s satisfies the app schema',
    async (_id, row) => {
      await expect(
        ICLSchema.validate(rowToIclInputs(row))
      ).resolves.toBeTruthy();
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s resolves to its expected age at the pinned clock',
    (_id, row) => {
      jest.useFakeTimers('modern');
      jest.setSystemTime(new Date(PINNED_CLOCK_ISO));
      try {
        expect(rowToIclInputs(row).patient.age()).toBe(row.expectAge);
      } finally {
        jest.useRealTimers();
      }
    }
  );
});
