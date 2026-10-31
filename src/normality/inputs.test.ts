import { averageAca, knownAge } from './inputs';

import { PatientInfo } from '../types';

const patient = (dateOfBirth: string) =>
  new PatientInfo({ name: '', dateOfBirth, eye: 'left' });

describe('averageAca', () => {
  it('is the mean of a full pair', () => {
    expect(averageAca(30, 32)).toBe(31);
  });

  it.each([
    ['', 32],
    [32, ''],
    ['', ''],
    [undefined, 32],
    [Number.NaN, 32]
  ])('is missing for (%j, %j)', (nasal, temporal) => {
    expect(averageAca(nasal, temporal)).toBeUndefined();
  });

  it('keeps a genuine 0 as present', () => {
    expect(averageAca(0, 0)).toBe(0);
  });
});

describe('knownAge', () => {
  it.each([
    ['empty', ''],
    ['unparseable', 'not a date'],
    ['in the future', '2999-01-01']
  ])('is missing for a date of birth that is %s', (_why, dob) => {
    expect(knownAge(patient(dob))).toBeUndefined();
  });

  it('is the patient age for a past date of birth', () => {
    const p = patient('2000-07-01');
    expect(knownAge(p)).toBe(p.age());
    expect(knownAge(p)).toBeGreaterThan(20);
  });
});
