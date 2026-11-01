import { GoldenInputs } from './golden/types';
import { ICLSchema } from './ICLSchema';
import { PRESETS } from './presets';
import { PatientInfo } from './types';
import inputsJson from './golden/inputs.json';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const inputs = inputsJson as GoldenInputs;

// Pinned by hand: which replay row each preset was copied from.
const SOURCE_ROW: Record<string, string> = {
  'typical-myope': '01-baseline',
  'steep-cornea': '02-posterior-k',
  'after-myopic-surgery': '03-prior-myopia-rx',
  'after-hyperopic-surgery': '04-prior-hyperopia-rx',
  'smaller-segment': '07-small-lens-bin',
  'larger-segment': '08-large-lens-bin'
};

const patient = new PatientInfo({
  name: 'Preset check',
  dateOfBirth: '1990-01-01',
  eye: 'right'
});

describe('PRESETS', () => {
  it('covers exactly the six pinned cases, in order', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(Object.keys(SOURCE_ROW));
  });

  it('has unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
  });

  it('has unique labels', () => {
    expect(new Set(PRESETS.map((p) => p.label)).size).toBe(PRESETS.length);
  });

  it.each(PRESETS.map((p) => [p.id, p] as const))(
    '%s passes the app schema',
    async (_id, preset) => {
      await expect(
        ICLSchema.validate({ patient, ...preset.values })
      ).resolves.toBeTruthy();
    }
  );

  it.each(PRESETS.map((p) => [p.id, p] as const))(
    '%s matches the row it was copied from',
    (id, preset) => {
      const row = inputs.rows.find((r) => r.id === SOURCE_ROW[id]);
      expect(row).toBeDefined();
      expect(preset.values).toEqual({
        biometry: row?.biometry,
        corneaProfile: row?.corneaProfile,
        spectacleRefraction: row?.spectacleRefraction
      });
    }
  );

  it.each(PRESETS.map((p) => [p.id, p.label] as const))(
    '%s label names no lens size',
    (_id, label) => {
      // a size as 12.6, 13.7 or "126", or in millimetres
      expect(label).not.toMatch(/\b1[23](?:[.,]?\d+)?\b|\bmm\b/i);
      // or named in words
      expect(label).not.toMatch(/\b(?:lens|size|bin|small|large)/i);
    }
  );

  it('is copied, never imported, from the replay fixture', () => {
    const src = readFileSync(join(__dirname, 'presets.ts'), 'utf8');
    expect(src).not.toMatch(/golden/i);
  });
});
