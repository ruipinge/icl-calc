import { atom, selector } from 'recoil'


export const patientState = atom({
  key: 'patientState',
  default: {
    name: '',
    dateOfBirth: '',
    age: null,
    eye: ''
  }
});

export const patientFormatted = selector({
  key: 'patientFormatted',
  get: ({get}) => {
    const val = get(patientState);

    return `${val.name} (${val.dateOfBirth}), ${val.age} years old, ${val.eye} eye`;
  }
});
