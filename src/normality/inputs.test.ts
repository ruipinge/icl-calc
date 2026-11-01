import { averageAca } from './inputs';

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
