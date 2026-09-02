import { PatientInfo } from './types';

it('calculates patient age correctly', () => {
  // 2020-07-01
  const spy = vi.spyOn(Date, 'now').mockImplementation(() => 1593561600000);

  const patient = new PatientInfo({
    name: '',
    dateOfBirth: '',
    eye: 'left'
  });

  expect(patient.age()).toBe(0);

  patient.dateOfBirth = 'a';
  expect(patient.age()).toBe(0);

  patient.dateOfBirth = '2021-12-12';
  expect(patient.age()).toBe(0);

  patient.dateOfBirth = '2020-01-01';
  expect(patient.age()).toBe(0);

  patient.dateOfBirth = '2019-06-30';
  expect(patient.age()).toBe(1);

  patient.dateOfBirth = '2019-07-01';
  expect(patient.age()).toBe(1);

  patient.dateOfBirth = '2019-07-02';
  expect(patient.age()).toBe(0);

  spy.mockRestore();
});

// TEMPORARY - proving the CI `test` gate fails closed (Phase 3a task-6
// review, Critical 1). Remove this block once the red run is confirmed.
it('TEMPORARY: proves the test gate fails when a test fails', () => {
  expect(true).toBe(false);
});
