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
