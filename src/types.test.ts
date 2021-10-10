import { PatientInfo } from './types';

it('calculates patient age correctly', () => {
  // 2020-07-01
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => 1593561600000);

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
