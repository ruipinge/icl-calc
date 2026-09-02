import { GoldenInputs, GoldenRow, rowsSha256 } from './types';

import expectedJson from './expected.json';
import inputsJson from './inputs.json';

const inputs = inputsJson as GoldenInputs;
const expected = expectedJson as any;

// Deep-clone before mutating: the real fixture rows must never be written to.
const cloneRows = (): GoldenRow[] => JSON.parse(JSON.stringify(inputs.rows));

const baselineDigest = rowsSha256(inputs.rows);

// `capturedFrom.rowsSha256` is what stops fixture drift being misdiagnosed as
// an application regression under the stop rule (see replay.test.ts). These
// tests exist to keep that guard honest: a future change to what
// rowDigestPayload includes must be *visible* here as a test failure, not
// discovered later as a silently weakened guard. Every assertion drives the
// real, exported rowsSha256 - the same function the production assertions in
// replay.test.ts and e2e/replay.spec.ts call - never the module-private
// rowDigestPayload.
describe('rowsSha256', () => {
  it('matches the digest recorded in expected.json at capture time', () => {
    expect(baselineDigest).toBe(expected.capturedFrom.rowsSha256);
  });

  it('changes when a row id changes', () => {
    const rows = cloneRows();
    rows[0].id = `${rows[0].id}-mutated`;
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  it('changes when expectAge changes', () => {
    const rows = cloneRows();
    rows[0].expectAge = rows[0].expectAge + 1;
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  it('changes when a biometry value changes', () => {
    const rows = cloneRows();
    rows[0].biometry.ata = rows[0].biometry.ata + 0.1;
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  it('changes when a corneaProfile value changes', () => {
    const rows = cloneRows();
    rows[0].corneaProfile.kaf = rows[0].corneaProfile.kaf + 0.1;
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  it('changes when a spectacleRefraction value changes', () => {
    const rows = cloneRows();
    rows[0].spectacleRefraction.sphere =
      rows[0].spectacleRefraction.sphere + 0.1;
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  it('changes when previousSurgery changes', () => {
    const rows = cloneRows();
    rows[0].corneaProfile.previousSurgery =
      rows[0].corneaProfile.previousSurgery === 'None' ? 'Myopia' : 'None';
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  // patient.dateOfBirth is not cosmetic: it drives PatientInfo.age(), which
  // feeds the regression coefficients and the age gauge. A dateOfBirth edit
  // that leaves expectAge untouched would still change rendered output, so
  // the digest must catch it even though expectAge alone did not move.
  it('changes when patient.dateOfBirth changes', () => {
    const rows = cloneRows();
    rows[0].patient.dateOfBirth = '1970-03-15';
    expect(rowsSha256(rows)).not.toBe(baselineDigest);
  });

  // The digest is deliberately blind to `why`: it is prose for humans, never
  // read by rowToIclInputs, so fixing a typo in a comment must not force a
  // re-capture of the oracle. This is the guard the row 09 `why` edit in this
  // same commit relies on.
  it('does not change when a why string changes', () => {
    const rows = cloneRows();
    rows[0].why = `${rows[0].why} (mutated for this test)`;
    expect(rowsSha256(rows)).toBe(baselineDigest);
  });
});
