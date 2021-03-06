import * as Yup from 'yup';

const ACQ_MIN = 2.7,
  ACQ_MAX = 6.0,
  KF_MIN = 20,
  KF_MAX = 70,
  CCT_MIN = 300,
  CCT_MAX = 700,
  SPHERE_MIN = -25,
  SPHERE_MAX = 0,
  CYLINDRE_MIN = -8,
  CYLINDRE_MAX = 0,
  INVALID_ERROR = 'Invalid value.',
  REQUIRED_ERROR = 'Required value.',
  ACQ_INVALID_ERROR = `${INVALID_ERROR} [${ACQ_MIN}, ${ACQ_MAX}]`,
  KF_INVALID_ERROR = `${INVALID_ERROR} [${KF_MIN}, ${KF_MAX}]`,
  CCT_INVALID_ERROR = `${INVALID_ERROR} [${CCT_MIN}, ${CCT_MAX}]`,
  SPHERE_INVALID_ERROR = `${INVALID_ERROR} [${SPHERE_MIN}, ${SPHERE_MAX}]`,
  CYLINDRE_INVALID_ERROR = `${INVALID_ERROR} [${CYLINDRE_MIN}, ${CYLINDRE_MAX}]`;

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
      .min(ACQ_MIN, ACQ_INVALID_ERROR)
      .max(ACQ_MAX, ACQ_INVALID_ERROR),
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
      .min(KF_MIN, KF_INVALID_ERROR)
      .max(KF_MAX, KF_INVALID_ERROR),
    cct: Yup.number()
      .required(REQUIRED_ERROR)
      .min(CCT_MIN, CCT_INVALID_ERROR)
      .max(CCT_MAX, CCT_INVALID_ERROR)
  }),
  spectacleRefraction: Yup.object().shape({
    sphere: Yup.number()
      .required(REQUIRED_ERROR)
      .min(SPHERE_MIN, SPHERE_INVALID_ERROR)
      .max(SPHERE_MAX, SPHERE_INVALID_ERROR),
    cylindre: Yup.number()
      .required(REQUIRED_ERROR)
      .min(CYLINDRE_MIN, CYLINDRE_INVALID_ERROR)
      .max(CYLINDRE_MAX, CYLINDRE_INVALID_ERROR),
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
