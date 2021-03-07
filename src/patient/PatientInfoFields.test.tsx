import { calcAge, getDateOfBirthClassName } from './PatientInfoFields';

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

it('formats date of birth class names', () => {
  expect(getDateOfBirthClassName({ error: 'aa', touched: true })).toBe(
    'form-control is-invalid'
  );
  expect(getDateOfBirthClassName({ error: 'aa' })).toBe('form-control');
  expect(getDateOfBirthClassName({ error: 'aa', touched: false })).toBe(
    'form-control'
  );
  expect(getDateOfBirthClassName({ touched: true })).toBe('form-control');
  expect(getDateOfBirthClassName({})).toBe('form-control');
});
