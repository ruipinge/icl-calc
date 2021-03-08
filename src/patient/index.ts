export interface PatientInfo {
  name: string;
  dateOfBirth: string;
  eye: 'left' | 'right';
}

export interface Biometrics {
  ata: number;
  wtw: number;
  clr: number;
  acq: number;
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
  biometrics: Biometrics;
  spectacleRefraction: SpectacleRefraction;
}

export const INITIAL_VALUES: ICLInputs = {
  patient: {
    name: '',
    dateOfBirth: '',
    eye: 'left'
  },
  biometrics: {
    ata: 0,
    wtw: 0,
    clr: 0,
    acq: 0,
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
