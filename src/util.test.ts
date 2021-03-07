import { getClassName } from './util';

it('gets class name with default classes', () => {
  expect(getClassName({ error: 'aa', touched: true })).toBe(
    'form-control is-invalid'
  );
  expect(getClassName({ error: 'aa' })).toBe('form-control');
  expect(getClassName({ error: 'aa', touched: false })).toBe('form-control');
  expect(getClassName({ touched: true })).toBe('form-control');
  expect(getClassName({})).toBe('form-control');
});

it('gets class name custom base classes', () => {
  expect(getClassName({ base: [] })).toBe('');
  expect(
    getClassName({ error: 'aa', touched: true, base: ['one-class'] })
  ).toBe('one-class is-invalid');
  expect(
    getClassName({
      error: 'aa',
      touched: true,
      base: ['one-class', 'two-class']
    })
  ).toBe('one-class two-class is-invalid');
  expect(getClassName({ error: 'aa', base: ['one-class'] })).toBe('one-class');
  expect(
    getClassName({ error: 'aa', touched: false, base: ['one-class'] })
  ).toBe('one-class');
  expect(getClassName({ touched: true, base: ['one-class'] })).toBe(
    'one-class'
  );
  expect(getClassName({ base: ['one-class', 'two-class'] })).toBe(
    'one-class two-class'
  );
});

it('gets class name custom invalid classes', () => {
  expect(
    getClassName({ error: 'aa', touched: true, invalid: ['one-invalid'] })
  ).toBe('form-control one-invalid');
  expect(
    getClassName({
      error: 'aa',
      touched: true,
      invalid: ['one-invalid', 'two-invalid']
    })
  ).toBe('form-control one-invalid two-invalid');
  expect(getClassName({ error: 'aa', invalid: ['one-invalid'] })).toBe(
    'form-control'
  );
  expect(
    getClassName({ error: 'aa', touched: false, invalid: ['one-invalid'] })
  ).toBe('form-control');
  expect(getClassName({ touched: true, invalid: ['one-invalid'] })).toBe(
    'form-control'
  );
  expect(getClassName({ invalid: ['one-invalid', 'two-invalid'] })).toBe(
    'form-control'
  );
});

it('gets class name custom base and invalid classes', () => {
  expect(
    getClassName({
      error: 'aa',
      touched: true,
      base: ['one-class'],
      invalid: ['one-invalid']
    })
  ).toBe('one-class one-invalid');
  expect(
    getClassName({
      error: 'aa',
      touched: true,
      base: ['one-class', 'two-class'],
      invalid: ['one-invalid', 'two-invalid']
    })
  ).toBe('one-class two-class one-invalid two-invalid');
  expect(
    getClassName({
      error: 'aa',
      invalid: ['one-invalid'],
      base: ['one-class', 'two-class']
    })
  ).toBe('one-class two-class');
  expect(
    getClassName({
      error: 'aa',
      touched: false,
      base: ['one-class'],
      invalid: ['one-invalid']
    })
  ).toBe('one-class');
  expect(
    getClassName({
      touched: true,
      base: ['one-class'],
      invalid: ['one-invalid']
    })
  ).toBe('one-class');
  expect(
    getClassName({
      base: ['one-class', 'two-class'],
      invalid: ['one-invalid', 'two-invalid']
    })
  ).toBe('one-class two-class');
});
