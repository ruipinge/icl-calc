import ReactDOM from 'react-dom';

import { ICLForm, ICLInputs } from './ICLForm';

const initialValues: ICLInputs = {
  patient: {
    name: '',
    dateOfBirth: '',
    eye: 'left'
  },
  biometrics: {
    ata: 0,
    wtw: 0,
    clr: 0,
    acq: 0,
    acan: 0,
    acat: 0,
    kf: 0,
    cct: 0
  },
  spectacleRefraction: {
    sphere: 0,
    cylindre: 0,
    axis: 0,
    vertex: 0
  }
};

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ICLForm initialValues={initialValues} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
