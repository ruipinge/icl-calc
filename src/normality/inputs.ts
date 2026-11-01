import { measurement } from '../missing';

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
