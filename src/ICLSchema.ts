import * as Yup from 'yup';

const INVALID_ERROR = 'Invalid value.';
const REQUIRED_ERROR = 'Required value.';

export const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    name: Yup.string()
      .min(5, 'Too Short!')
      .max(10, 'Too Long!')
      .required('Required')
  }),
  biometrics: Yup.object().shape({
    ata: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(50, INVALID_ERROR),
    wtw: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-50, INVALID_ERROR)
      .max(50, INVALID_ERROR),
    clr: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR),
    acd: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-50, INVALID_ERROR)
      .max(50, INVALID_ERROR),
    acan: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(180, INVALID_ERROR),
    acat: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(180, INVALID_ERROR),
    kfm: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR),
    cct: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR)
  }),
  spectacleRefraction: Yup.object().shape({
    sphere: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR),
    cylindre: Yup.number()
      .required(REQUIRED_ERROR)
      .min(-1000, INVALID_ERROR)
      .max(1000, INVALID_ERROR),
    axis: Yup.number()
      .required(REQUIRED_ERROR)
      .min(0, INVALID_ERROR)
      .max(180, INVALID_ERROR)
  })
});
