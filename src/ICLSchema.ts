import * as Yup from 'yup';

const INVALID_ERROR = 'Invalid value.';
const REQUIRED_ERROR = 'Required value.';

export const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    // TODO:
    dateOfBirth: Yup.string()
      .min(5, 'Too Short!')
      .max(10, 'Too Long!')
      .required('Required')
  }),
  biometrics: Yup.object().shape({
    ata: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(20, INVALID_ERROR),
    wtw: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(20, INVALID_ERROR),
    clr: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR),
    acq: Yup.number()
      .required(REQUIRED_ERROR)
      .min(2.7, INVALID_ERROR)
      .max(6.0, INVALID_ERROR),
    acan: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(70, INVALID_ERROR),
    acat: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(70, INVALID_ERROR),
    kf: Yup.number()
      .required(REQUIRED_ERROR)
      .min(20, INVALID_ERROR)
      .max(70, INVALID_ERROR),
    cct: Yup.number()
      .required(REQUIRED_ERROR)
      .min(300, INVALID_ERROR)
      .max(700, INVALID_ERROR)
  }),
  spectacleRefraction: Yup.object().shape({
    sphere: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-25, INVALID_ERROR)
      .max(0, INVALID_ERROR),
    cylindre: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-8, INVALID_ERROR)
      .max(0, INVALID_ERROR),
    axis: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(180, INVALID_ERROR),
    vertex: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(20, INVALID_ERROR)
  })
});
