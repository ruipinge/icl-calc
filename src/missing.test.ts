import {
  ICLFormValues,
  INITIAL_VALUES,
  PatientInfo,
  PreviousSurgery
} from './types';
import {
  ICL_POWER_FIELDS,
  MATRIX_FIELDS,
  REGRESSION_FIELDS,
  iclPowerInputs,
  knownAge,
  matrixInputs,
  measurement,
  missingLabels,
  regressionInputs
} from './missing';

const patient = (dateOfBirth: string) =>
  new PatientInfo({ name: '', dateOfBirth, eye: 'left' });

// The single missing-value rule behind both the name and the pointer.
it.each([
  ['an empty string', ''],
  ['undefined', undefined],
  ['null', null],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['a numeric string', '4']
])('treats %s as a missing measurement', (_, value) =>
  expect(measurement(value)).toBeUndefined()
);

it.each([0, 4.1, -208])('passes the number %s through', (value) =>
  expect(measurement(value)).toBe(value)
);

describe('knownAge', () => {
  it.each([
    ['empty', ''],
    ['unparseable', 'not a date'],
    ['in the future', '2999-01-01']
  ])('is missing for a date of birth that is %s', (_why, dob) => {
    expect(knownAge(patient(dob))).toBeUndefined();
  });

  it('is missing for a date of birth a few months ahead', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 31));
    try {
      expect(knownAge(patient('2027-03-01'))).toBeUndefined();
    } finally {
      now.mockRestore();
    }
  });

  it('is the patient age for a past date of birth', () => {
    const p = patient('2000-07-01');
    expect(knownAge(p)).toBe(p.age());
    expect(knownAge(p)).toBeGreaterThan(20);
  });
});

/* Every field a number, with a past date of birth: nothing is missing. */
const FULL: ICLFormValues = {
  patient: patient('2000-07-01'),
  biometry: { ata: 11.8, wtw: 11.9, clr: 250, acd: 3.2, acan: 38, acat: 40 },
  corneaProfile: {
    kaf: 43,
    kas: 44.5,
    kpf: 6.1,
    kps: 6.4,
    axisaf: 10,
    axisas: 100,
    axispf: 12,
    axisps: 102,
    cct: 540,
    previousSurgery: PreviousSurgery.myopia
  },
  spectacleRefraction: { sphere: -10, cylindre: -2.25, axis: 50, vertex: 12 }
};

type Section = 'biometry' | 'corneaProfile' | 'spectacleRefraction';

const without = (section: Section, key: string): ICLFormValues => ({
  ...FULL,
  [section]: { ...FULL[section], [key]: '' }
});

describe('missingLabels', () => {
  it('lists every regression field on a fresh form, in form order', () => {
    expect(missingLabels(INITIAL_VALUES, REGRESSION_FIELDS)).toEqual([
      'Date of Birth',
      'AtA',
      'CLR',
      'ACD',
      'KAntFlt',
      'KAntStp',
      'CCT',
      'Sphere',
      'Cylindre',
      'Vertex'
    ]);
  });

  it('lists the matrix fields on a fresh form', () => {
    expect(missingLabels(INITIAL_VALUES, MATRIX_FIELDS)).toEqual([
      'AtA',
      'CLR'
    ]);
  });

  it.each([
    ['regression', REGRESSION_FIELDS],
    ['matrix', MATRIX_FIELDS],
    ['ICL power', ICL_POWER_FIELDS]
  ] as const)('lists no %s field when every one is entered', (_, fields) => {
    expect(missingLabels(FULL, fields)).toEqual([]);
  });

  it.each([
    ['biometry', 'acd', 'ACD'],
    ['corneaProfile', 'kaf', 'KAntFlt'],
    ['corneaProfile', 'kas', 'KAntStp'],
    ['corneaProfile', 'cct', 'CCT'],
    ['spectacleRefraction', 'sphere', 'Sphere'],
    ['spectacleRefraction', 'cylindre', 'Cylindre'],
    ['spectacleRefraction', 'vertex', 'Vertex']
  ] as const)('names %s.%s alone as %s', (section, key, label) => {
    expect(missingLabels(without(section, key), ICL_POWER_FIELDS)).toEqual([
      label
    ]);
  });

  it('keeps form order whichever fields are missing', () => {
    const values = {
      ...without('spectacleRefraction', 'vertex'),
      patient: patient(''),
      biometry: { ...FULL.biometry, clr: '' as const }
    };
    expect(missingLabels(values, REGRESSION_FIELDS)).toEqual([
      'Date of Birth',
      'CLR',
      'Vertex'
    ]);
  });

  it('names a future date of birth as missing', () => {
    expect(
      missingLabels({ ...FULL, patient: patient('2999-01-01') }, [
        REGRESSION_FIELDS[0]
      ])
    ).toEqual(['Date of Birth']);
  });

  it('ignores fields no calculation needs', () => {
    const values = {
      ...FULL,
      biometry: { ...FULL.biometry, wtw: '' as const, acan: '' as const },
      corneaProfile: { ...FULL.corneaProfile, kpf: '' as const }
    };
    expect(missingLabels(values, REGRESSION_FIELDS)).toEqual([]);
  });
});

describe('iclPowerInputs', () => {
  it('carries exactly the numbers of a full form', () => {
    expect(iclPowerInputs(FULL)).toStrictEqual(FULL);
  });

  it('is undefined on a fresh form', () => {
    expect(iclPowerInputs(INITIAL_VALUES)).toBeUndefined();
  });

  it.each([
    ['biometry', 'acd'],
    ['corneaProfile', 'kaf'],
    ['corneaProfile', 'kas'],
    ['corneaProfile', 'cct'],
    ['spectacleRefraction', 'sphere'],
    ['spectacleRefraction', 'cylindre'],
    ['spectacleRefraction', 'vertex']
  ] as const)('is undefined without %s.%s', (section, key) => {
    expect(iclPowerInputs(without(section, key))).toBeUndefined();
  });

  it.each([
    ['biometry', 'ata'],
    ['biometry', 'wtw'],
    ['biometry', 'clr'],
    ['biometry', 'acan'],
    ['biometry', 'acat'],
    ['corneaProfile', 'kpf'],
    ['corneaProfile', 'kps'],
    ['corneaProfile', 'axisaf'],
    ['corneaProfile', 'axisas'],
    ['corneaProfile', 'axispf'],
    ['corneaProfile', 'axisps'],
    ['spectacleRefraction', 'axis']
  ] as const)('turns an empty %s.%s into 0', (section, key) => {
    const inputs = iclPowerInputs(without(section, key));
    expect(inputs).toStrictEqual({
      ...FULL,
      [section]: { ...FULL[section], [key]: 0 }
    });
  });
});

describe('regressionInputs and matrixInputs', () => {
  it('carry exactly the entered numbers when everything is present', () => {
    expect(regressionInputs(FULL)).toEqual({
      acd: 3.2,
      ata: 11.8,
      clr: 250,
      age: FULL.patient.age(),
      power: iclPowerInputs(FULL)
    });
    expect(matrixInputs(FULL)).toEqual({ ata: 11.8, clr: 250 });
  });

  it('are undefined on a fresh form', () => {
    expect(regressionInputs(INITIAL_VALUES)).toBeUndefined();
    expect(matrixInputs(INITIAL_VALUES)).toBeUndefined();
  });

  it.each([
    ['biometry', 'ata'],
    ['biometry', 'clr'],
    ['biometry', 'acd'],
    ['corneaProfile', 'kaf'],
    ['spectacleRefraction', 'vertex']
  ] as const)('regression is undefined without %s.%s', (section, key) => {
    expect(regressionInputs(without(section, key))).toBeUndefined();
  });

  it('regression is undefined without a known date of birth', () => {
    expect(
      regressionInputs({ ...FULL, patient: patient('2999-01-01') })
    ).toBeUndefined();
  });

  it.each(['ata', 'clr'])('matrix is undefined without %s', (key) => {
    expect(matrixInputs(without('biometry', key))).toBeUndefined();
  });

  it('matrix needs neither the date of birth nor the ICL power fields', () => {
    expect(
      matrixInputs({
        ...INITIAL_VALUES,
        biometry: { ...INITIAL_VALUES.biometry, ata: 11.8, clr: 250 }
      })
    ).toEqual({ ata: 11.8, clr: 250 });
  });
});
