import { differenceInYears } from 'date-fns';

export type Eye = 'left' | 'right';

export enum PreviousSurgery {
  none = 'None',
  myopia = 'Myopia',
  hyperopia = 'Hyperopia'
}

export interface PatientInfoInterface {
  name: string;
  dateOfBirth: string;
  eye: Eye;
  age(): number;
}

export class PatientInfo implements PatientInfoInterface {
  name: string;
  dateOfBirth: string;
  eye: Eye;

  age(): number {
    if (!this.dateOfBirth) {
      return 0;
    }
    const d: Date = new Date(this.dateOfBirth);
    if (isNaN(d.getTime())) {
      return 0;
    }
    const diff: number = differenceInYears(new Date(Date.now()), d);
    return diff < 0 ? 0 : diff;
  }

  constructor({
    name,
    dateOfBirth,
    eye
  }: {
    name: string;
    dateOfBirth: string;
    eye: Eye;
  }) {
    this.name = name;
    this.dateOfBirth = dateOfBirth;
    this.eye = eye;
  }
}

export interface Biometry {
  ata: number;
  wtw: number;
  clr: number;
  acd: number;
  acan: number;
  acat: number;
}

export interface CorneaProfile {
  kaf: number;
  kas: number;
  kpf: number;
  kps: number;
  axisaf: number;
  axisas: number;
  axispf: number;
  axisps: number;
  cct: number;
  previousSurgery: PreviousSurgery;
}

export interface SpectacleRefraction {
  sphere: number;
  cylindre: number;
  axis: number;
  vertex: number;
}

export interface ICLInputs {
  patient: PatientInfo;
  biometry: Biometry;
  corneaProfile: CorneaProfile;
  spectacleRefraction: SpectacleRefraction;
}

/**
 * A section as the form holds it: every numeric field may also be `''`,
 * which is what a Formik number input holds while it is empty. Nothing
 * reads these as numbers directly - `src/missing.ts` decides what is
 * present and builds the numeric `ICLInputs` the formulas take.
 */
type FormSection<T> = {
  [K in keyof T]: T[K] extends number ? number | '' : T[K];
};

export interface ICLFormValues {
  patient: PatientInfo;
  biometry: FormSection<Biometry>;
  corneaProfile: FormSection<CorneaProfile>;
  spectacleRefraction: FormSection<SpectacleRefraction>;
}

/*
 * Every measured field starts empty, not 0: 0 is a value a clinician could
 * enter, and the calculator used to compute from it as if they had (#196).
 */
export const INITIAL_VALUES: ICLFormValues = {
  patient: new PatientInfo({
    name: '',
    dateOfBirth: '',
    eye: 'left'
  }),
  biometry: {
    ata: '',
    wtw: '',
    clr: '',
    acd: '',
    acan: '',
    acat: ''
  },
  corneaProfile: {
    kaf: '',
    kas: '',
    kpf: '',
    kps: '',
    axisaf: '',
    axisas: '',
    axispf: '',
    axisps: '',
    cct: '',
    previousSurgery: PreviousSurgery.none
  },
  spectacleRefraction: {
    sphere: '',
    cylindre: '',
    axis: '',
    vertex: ''
  }
};
