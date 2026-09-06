import { ICLInputs, PatientInfo, PreviousSurgery } from './types';

import { ICLSchema } from './ICLSchema';

/**
 * The same numbers as golden-master row `02-posterior-k` (see
 * src/golden/inputs.json) - the only fixture that supplies posterior
 * keratometry, and a deliberately steep/ectatic posterior cornea whose
 * steep meridian (7.4 D) sits above the 7.0 D ceiling the issue proposed.
 * Duplicated here rather than imported so this file tests the schema on its
 * own; src/golden/inputs.test.ts is the live guard that every fixture row
 * still satisfies the schema.
 */
const VALID_INPUTS: ICLInputs = {
  patient: new PatientInfo({
    name: 'GM-02',
    dateOfBirth: '1996-03-15',
    eye: 'right'
  }),
  biometry: { ata: 11.8, wtw: 11.9, clr: 250, acd: 3.2, acan: 38, acat: 39 },
  corneaProfile: {
    kaf: 43,
    axisaf: 180,
    kas: 44,
    axisas: 90,
    kpf: 7.0,
    axispf: 180,
    kps: 7.4,
    axisps: 90,
    cct: 540,
    previousSurgery: PreviousSurgery.none
  },
  spectacleRefraction: { sphere: -6, cylindre: -1, axis: 180, vertex: 12 }
};

const withCornea = (overrides: Partial<ICLInputs['corneaProfile']>) => ({
  ...VALID_INPUTS,
  corneaProfile: { ...VALID_INPUTS.corneaProfile, ...overrides }
});

const POSTERIOR_K_ERROR = 'Invalid value. [4, 8] or 0 if not measured.';
const AXIS_ERROR = 'Invalid value. [0, 180]';

describe('posterior keratometry validation', () => {
  it('accepts golden row 02 in full (7.0 / 7.4 @ 180 / 90)', async () => {
    await expect(ICLSchema.validate(VALID_INPUTS)).resolves.toBeTruthy();
  });

  it.each([
    ['kpf', -7.0],
    ['kps', -7.4],
    ['kpf', -6.2],
    ['kps', -6.2]
  ] as const)(
    'rejects a negative %s of %s - the device-reported sign',
    async (field, value) => {
      await expect(
        ICLSchema.validate(withCornea({ [field]: value }))
      ).rejects.toThrow(POSTERIOR_K_ERROR);
    }
  );

  it.each(['kpf', 'kps'] as const)(
    'accepts %s = 0, the not-supplied sentinel',
    async (field) => {
      // Every fixture row other than 02, and INITIAL_VALUES itself, encodes
      // "not measured" as 0; calcRadiusPosterior's `if (kpf && kps)` guard
      // reads it the same way. A bare `.min(4)` would reject all of them.
      await expect(
        ICLSchema.validate(withCornea({ kpf: 0, kps: 0, axispf: 0, axisps: 0 }))
      ).resolves.toBeTruthy();
      await expect(
        ICLSchema.validateAt('corneaProfile.' + field, {
          corneaProfile: { [field]: 0 }
        })
      ).resolves.toBe(0);
    }
  );

  it.each(['kpf', 'kps'] as const)(
    'leaves %s optional (undefined passes)',
    async (field) => {
      await expect(
        ICLSchema.validateAt('corneaProfile.' + field, { corneaProfile: {} })
      ).resolves.toBeUndefined();
    }
  );

  it.each([
    ['kpf', 3.9],
    ['kps', 3.9],
    ['kpf', 8.1],
    ['kps', 8.1],
    ['kpf', 43],
    ['kps', 44]
  ] as const)('rejects an out-of-range %s of %s', async (field, value) => {
    await expect(
      ICLSchema.validate(withCornea({ [field]: value }))
    ).rejects.toThrow(POSTERIOR_K_ERROR);
  });

  it.each([
    ['kpf', 4.0],
    ['kps', 4.0],
    ['kpf', 6.2],
    ['kps', 6.5],
    ['kpf', 8.0],
    ['kps', 8.0]
  ] as const)('accepts an in-range %s of %s', async (field, value) => {
    await expect(
      ICLSchema.validate(withCornea({ [field]: value }))
    ).resolves.toBeTruthy();
  });
});

describe('posterior axis validation', () => {
  it.each([
    ['axispf', -1],
    ['axisps', -1],
    ['axispf', 181],
    ['axisps', 200]
  ] as const)('rejects an out-of-range %s of %s', async (field, value) => {
    await expect(
      ICLSchema.validate(withCornea({ [field]: value }))
    ).rejects.toThrow(AXIS_ERROR);
  });

  it.each([
    ['axispf', 0],
    ['axisps', 0],
    ['axispf', 180],
    ['axisps', 180]
  ] as const)('accepts an in-range %s of %s', async (field, value) => {
    await expect(
      ICLSchema.validate(withCornea({ [field]: value }))
    ).resolves.toBeTruthy();
  });

  it('leaves the posterior axes optional', async () => {
    await expect(
      ICLSchema.validateAt('corneaProfile.axispf', { corneaProfile: {} })
    ).resolves.toBeUndefined();
    await expect(
      ICLSchema.validateAt('corneaProfile.axisps', { corneaProfile: {} })
    ).resolves.toBeUndefined();
  });
});
