import { ICLFormValues, ICLInputs } from './types';

/**
 * The one rule for "no value entered", shared by the gauge's name and its
 * drawing so they cannot disagree. A cleared form field reaches the gauge as
 * `''` (Formik), untyped, and `LinearGauge` would coerce that to 0 and draw a
 * pointer; anything that is not a finite number is missing.
 *
 * @param {unknown} value - The measurement, as it reached the component
 * @returns {number | undefined} the number, or undefined where missing
 */
export const measurement = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * The age the gauge is given: `undefined` ("missing") where the date of birth
 * is empty or unparseable (both an Invalid Date) or in the future - the three
 * cases in which `PatientInfo.age()` answers 0, which would be drawn as a real
 * age.
 *
 * @param {{ dateOfBirth: string, age(): number }} patient
 * @returns {number | undefined}
 */
export const knownAge = (patient: { dateOfBirth: string; age(): number }) => {
  const born = new Date(patient.dateOfBirth);
  // Compared as instants, not through differenceInYears: that truncates
  // toward zero, so a date up to a year ahead would give 0, not a negative.
  if (isNaN(born.getTime()) || born.getTime() > Date.now()) {
    return undefined;
  }
  return patient.age();
};

/**
 * A field a calculation needs: its short label, in the form's own
 * abbreviation, and whether the form is missing it.
 */
export interface RequiredField {
  readonly label: string;
  readonly isMissing: (values: ICLFormValues) => boolean;
}

type Section = 'biometry' | 'corneaProfile' | 'spectacleRefraction';

/* The keys of a section that hold a measurement (not `previousSurgery`). */
type NumericKey<S extends Section> = {
  [K in keyof ICLFormValues[S]]: ICLFormValues[S][K] extends number | ''
    ? K
    : never;
}[keyof ICLFormValues[S]];

const measured = <S extends Section>(
  label: string,
  section: S,
  key: NumericKey<S>
): RequiredField => ({
  label,
  isMissing: (values) => measurement(values[section][key]) === undefined
});

const DATE_OF_BIRTH: RequiredField = {
  label: 'Date of Birth',
  isMissing: (values) => knownAge(values.patient) === undefined
};
const ATA = measured('AtA', 'biometry', 'ata');
const CLR = measured('CLR', 'biometry', 'clr');

/**
 * Every field the ICL Power and SE formulas read and cannot do without, in
 * form order. The posterior keratometry pair is optional (see
 * `iclPowerInputs`).
 */
export const ICL_POWER_FIELDS: readonly RequiredField[] = [
  measured('ACD', 'biometry', 'acd'),
  measured('KAntFlt', 'corneaProfile', 'kaf'),
  measured('KAntStp', 'corneaProfile', 'kas'),
  measured('CCT', 'corneaProfile', 'cct'),
  measured('Sphere', 'spectacleRefraction', 'sphere'),
  measured('Cylindre', 'spectacleRefraction', 'cylindre'),
  measured('Vertex', 'spectacleRefraction', 'vertex')
];

/** The regression reads age, AtA, CLR, ACD and the ICL SE, in form order. */
export const REGRESSION_FIELDS: readonly RequiredField[] = [
  DATE_OF_BIRTH,
  ATA,
  CLR,
  ...ICL_POWER_FIELDS
];

/** The floating matrix filters on AtA and CLR. */
export const MATRIX_FIELDS: readonly RequiredField[] = [ATA, CLR];

/**
 * The short labels of the fields in `fields` the form is missing, in the
 * order `fields` lists them (form order, for the groups above).
 *
 * @param {ICLFormValues} values - The form's values
 * @param {readonly RequiredField[]} fields - One of the groups above
 * @returns {string[]}
 */
export const missingLabels = (
  values: ICLFormValues,
  fields: readonly RequiredField[]
): string[] =>
  fields.filter((field) => field.isMissing(values)).map((field) => field.label);

/*
 * An empty field the formulas can do without, as 0. Only ever applied after
 * the required fields are known present, where it passes numbers through
 * untouched.
 */
const orZero = (value: number | ''): number => (value === '' ? 0 : value);

/**
 * The numeric inputs the ICL Power and SE formulas take, or `undefined` when
 * any field in `ICL_POWER_FIELDS` is missing. When every field holds a number
 * the result carries exactly those numbers, so the formulas compute exactly
 * what they did from the form values themselves.
 *
 * An empty posterior keratometry reading becomes 0: `calcRadiusPosterior`'s
 * `if (kpf && kps)` guard treats `''` and 0 alike, so this changes nothing
 * (pinned in formulas.test.ts). The other empty fields that become 0 - AtA,
 * WtW, CLR, ACAn, ACAt, the four keratometry axes and the refraction axis -
 * are never read by these formulas at all.
 *
 * @param {ICLFormValues} values - The form's values
 * @returns {ICLInputs | undefined}
 */
export const iclPowerInputs = (
  values: ICLFormValues
): ICLInputs | undefined => {
  if (missingLabels(values, ICL_POWER_FIELDS).length > 0) {
    return undefined;
  }
  const { patient, biometry, corneaProfile, spectacleRefraction } = values;
  return {
    patient,
    biometry: {
      ata: orZero(biometry.ata),
      wtw: orZero(biometry.wtw),
      clr: orZero(biometry.clr),
      acd: orZero(biometry.acd),
      acan: orZero(biometry.acan),
      acat: orZero(biometry.acat)
    },
    corneaProfile: {
      kaf: orZero(corneaProfile.kaf),
      kas: orZero(corneaProfile.kas),
      kpf: orZero(corneaProfile.kpf),
      kps: orZero(corneaProfile.kps),
      axisaf: orZero(corneaProfile.axisaf),
      axisas: orZero(corneaProfile.axisas),
      axispf: orZero(corneaProfile.axispf),
      axisps: orZero(corneaProfile.axisps),
      cct: orZero(corneaProfile.cct),
      previousSurgery: corneaProfile.previousSurgery
    },
    spectacleRefraction: {
      sphere: orZero(spectacleRefraction.sphere),
      cylindre: orZero(spectacleRefraction.cylindre),
      axis: orZero(spectacleRefraction.axis),
      vertex: orZero(spectacleRefraction.vertex)
    }
  };
};

/** What the Regression needs, every one present: see `regressionInputs`. */
export interface RegressionNumbers {
  readonly acd: number;
  readonly ata: number;
  readonly clr: number;
  readonly age: number;
  /** The inputs of the ICL formulas, for the spherical equivalent. */
  readonly power: ICLInputs;
}

/**
 * The numbers the Regression is fed, or `undefined` when any field in
 * `REGRESSION_FIELDS` is missing. Present fields carry exactly the entered
 * numbers, so the table computes what it did from the form values themselves.
 *
 * @param {ICLFormValues} values - The form's values
 * @returns {RegressionNumbers | undefined}
 */
export const regressionInputs = (
  values: ICLFormValues
): RegressionNumbers | undefined => {
  const power = iclPowerInputs(values);
  const age = knownAge(values.patient);
  const acd = measurement(values.biometry.acd);
  const ata = measurement(values.biometry.ata);
  const clr = measurement(values.biometry.clr);
  if (
    power === undefined ||
    age === undefined ||
    acd === undefined ||
    ata === undefined ||
    clr === undefined
  ) {
    return undefined;
  }
  return { acd, ata, clr, age, power };
};

/**
 * The AtA and CLR the floating matrix filters on, or `undefined` when either
 * is missing (`MATRIX_FIELDS`).
 *
 * @param {ICLFormValues} values - The form's values
 * @returns {{ ata: number, clr: number } | undefined}
 */
export const matrixInputs = (
  values: ICLFormValues
): { ata: number; clr: number } | undefined => {
  const ata = measurement(values.biometry.ata);
  const clr = measurement(values.biometry.clr);
  return ata === undefined || clr === undefined ? undefined : { ata, clr };
};
