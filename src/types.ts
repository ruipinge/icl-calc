import { differenceInYears } from 'date-fns';

export interface PatientInfoInterface {
  name: string;
  dateOfBirth: string;
  eye: 'left' | 'right';
  age(): number;
}

export class PatientInfo implements PatientInfoInterface {
  name: string;
  dateOfBirth: string;
  eye: 'left' | 'right';

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
    eye: 'left' | 'right';
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
  kf: number;
  cct: number;
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
  spectacleRefraction: SpectacleRefraction;
}

export const INITIAL_VALUES: ICLInputs = {
  patient: new PatientInfo({
    name: '',
    dateOfBirth: '',
    eye: 'left'
  }),
  biometry: {
    ata: 0,
    wtw: 0,
    clr: 0,
    acd: 0,
    acan: 0,
    acat: 0,
    kf: 0,
    cct: 0
  },
  spectacleRefraction: {
    sphere: 0,
    cylindre: 0,
    axis: 0,
    vertex: 0
  }
};
