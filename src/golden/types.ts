import { ICLInputs, PatientInfo, PreviousSurgery } from '../types';

export const PINNED_CLOCK_ISO = '2026-08-30T12:00:00Z';

export interface GoldenRow {
  id: string;
  why: string;
  expectAge: number;
  patient: { name: string; dateOfBirth: string; eye: 'left' | 'right' };
  biometry: {
    ata: number; wtw: number; clr: number;
    acd: number; acan: number; acat: number;
  };
  corneaProfile: {
    kaf: number; axisaf: number; kas: number; axisas: number;
    kpf: number; axispf: number; kps: number; axisps: number;
    cct: number; previousSurgery: 'None' | 'Myopia' | 'Hyperopia';
  };
  spectacleRefraction: {
    sphere: number; cylindre: number; axis: number; vertex: number;
  };
}

export interface GoldenInputs {
  clock: string;
  rows: GoldenRow[];
}

const SURGERY: Record<string, PreviousSurgery> = {
  None: PreviousSurgery.none,
  Myopia: PreviousSurgery.myopia,
  Hyperopia: PreviousSurgery.hyperopia
};

/** The single conversion from fixture JSON into the app's own input type. */
export const rowToIclInputs = (row: GoldenRow): ICLInputs => ({
  patient: new PatientInfo({
    name: row.patient.name,
    dateOfBirth: row.patient.dateOfBirth,
    eye: row.patient.eye
  }),
  biometry: { ...row.biometry },
  corneaProfile: {
    ...row.corneaProfile,
    previousSurgery: SURGERY[row.corneaProfile.previousSurgery]
  },
  spectacleRefraction: { ...row.spectacleRefraction }
});
