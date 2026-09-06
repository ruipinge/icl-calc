import { ICLInputs, PatientInfo, PreviousSurgery } from '../types';
import { createHash } from 'crypto';

export const PINNED_CLOCK_ISO = '2026-08-30T12:00:00Z';

export interface GoldenRow {
  id: string;
  why: string;
  expectAge: number;
  patient: { name: string; dateOfBirth: string; eye: 'left' | 'right' };
  biometry: {
    ata: number;
    wtw: number;
    clr: number;
    acd: number;
    acan: number;
    acat: number;
  };
  corneaProfile: {
    kaf: number;
    axisaf: number;
    kas: number;
    axisas: number;
    kpf: number;
    axispf: number;
    kps: number;
    axisps: number;
    cct: number;
    previousSurgery: 'None' | 'Myopia' | 'Hyperopia';
  };
  spectacleRefraction: {
    sphere: number;
    cylindre: number;
    axis: number;
    vertex: number;
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

/**
 * The subset of a fixture row that can affect a captured/replayed result:
 * `id` and `expectAge` (both asserted against) plus every input value. `why`
 * is deliberately excluded - it is prose for humans, never read by
 * rowToIclInputs, so editing it must not force a re-capture of the oracle.
 *
 * Field order is explicit (not a spread of the row) so the digest is stable
 * even if inputs.json's own key order is ever reformatted, and so a field
 * silently added to GoldenRow in the future does not silently start (or fail
 * to start) affecting the digest without a deliberate decision here.
 */
const rowDigestPayload = (row: GoldenRow) => ({
  id: row.id,
  expectAge: row.expectAge,
  patient: {
    name: row.patient.name,
    dateOfBirth: row.patient.dateOfBirth,
    eye: row.patient.eye
  },
  biometry: {
    ata: row.biometry.ata,
    wtw: row.biometry.wtw,
    clr: row.biometry.clr,
    acd: row.biometry.acd,
    acan: row.biometry.acan,
    acat: row.biometry.acat
  },
  corneaProfile: {
    kaf: row.corneaProfile.kaf,
    axisaf: row.corneaProfile.axisaf,
    kas: row.corneaProfile.kas,
    axisas: row.corneaProfile.axisas,
    kpf: row.corneaProfile.kpf,
    axispf: row.corneaProfile.axispf,
    kps: row.corneaProfile.kps,
    axisps: row.corneaProfile.axisps,
    cct: row.corneaProfile.cct,
    previousSurgery: row.corneaProfile.previousSurgery
  },
  spectacleRefraction: {
    sphere: row.spectacleRefraction.sphere,
    cylindre: row.spectacleRefraction.cylindre,
    axis: row.spectacleRefraction.axis,
    vertex: row.spectacleRefraction.vertex
  }
});

/**
 * sha256 of only what can affect a captured/replayed result - the `rows`
 * array, canonically ordered, with each row's `why` excluded. Deliberately
 * NOT a hash of inputs.json's raw bytes: that hashed prose too, so fixing a
 * typo in a `why` comment used to force a full oracle re-capture. Shared by
 * e2e/capture.spec.ts (writes it), src/golden/replay.test.ts and
 * e2e/replay.spec.ts (both check it) so the three can never disagree about
 * what "the digest" means.
 */
export const rowsSha256 = (rows: GoldenRow[]): string =>
  createHash('sha256')
    .update(JSON.stringify(rows.map(rowDigestPayload)))
    .digest('hex');

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
