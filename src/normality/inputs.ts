import { measurement } from './Gauge';

/**
 * The ACA the gauge is given: the mean of the two angles, or `undefined`
 * ("missing") when either is missing. A cleared field reaches here as `''`,
 * and `('' + 32) / 2` is 16 - a real-looking ACA nobody entered.
 *
 * @param {unknown} acan - Nasal angle, as it came from the form
 * @param {unknown} acat - Temporal angle, as it came from the form
 * @returns {number | undefined}
 */
export const averageAca = (acan: unknown, acat: unknown) => {
  const nasal = measurement(acan);
  const temporal = measurement(acat);
  return nasal === undefined || temporal === undefined
    ? undefined
    : (nasal + temporal) / 2.0;
};

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
