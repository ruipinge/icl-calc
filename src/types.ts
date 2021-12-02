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
    acat: 0
  },
  corneaProfile: {
    kaf: 0,
    kas: 0,
    kpf: 0,
    kps: 0,
    axisaf: 0,
    axisas: 0,
    axispf: 0,
    axisps: 0,
    cct: 0,
    previousSurgery: PreviousSurgery.none
  },
  spectacleRefraction: {
    sphere: 0,
    cylindre: 0,
    axis: 0,
    vertex: 0
  }
};
