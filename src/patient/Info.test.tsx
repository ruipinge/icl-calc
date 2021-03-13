import { calcAge } from './Info';

it('calculates age', () => {
  expect(calcAge({})).toBe(0);
  expect(calcAge({ error: 'a' })).toBe(0);
  expect(calcAge({ dateOfBirth: 'a' })).toBe(0);
  expect(calcAge({ error: 'a', dateOfBirth: 'a' })).toBe(0);
  expect(calcAge({ error: 'a', dateOfBirth: '2020-01-01' })).toBe(0);
  expect(
    calcAge({ error: undefined, dateOfBirth: '2020-01-01' })
  ).toBeGreaterThan(0);
});
