import * as Yup from 'yup';

const ACD_MIN = 2.7,
  ACD_MAX = 6.0,
  KF_MIN = 35,
  KF_MAX = 50,
  CCT_MIN = 300,
  CCT_MAX = 700,
  SPHERE_MIN = -25,
  SPHERE_MAX = 0,
  CYLINDRE_MIN = -8,
  CYLINDRE_MAX = 0,
  INVALID_ERROR = 'Invalid value.',
  REQUIRED_ERROR = 'Required value.',
  ACD_INVALID_ERROR = `${INVALID_ERROR} [${ACD_MIN}, ${ACD_MAX}]`,
  KF_INVALID_ERROR = `${INVALID_ERROR} [${KF_MIN}, ${KF_MAX}]`,
  CCT_INVALID_ERROR = `${INVALID_ERROR} [${CCT_MIN}, ${CCT_MAX}]`,
  SPHERE_INVALID_ERROR = `${INVALID_ERROR} [${SPHERE_MIN}, ${SPHERE_MAX}]`,
  CYLINDRE_INVALID_ERROR = `${INVALID_ERROR} [${CYLINDRE_MIN}, ${CYLINDRE_MAX}]`;

export const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    dateOfBirth: Yup.date().optional().typeError('Invalid date. (yyyy-mm-dd)')
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
    acd: Yup.number()
      .required(REQUIRED_ERROR)
      .min(ACD_MIN, ACD_INVALID_ERROR)
      .max(ACD_MAX, ACD_INVALID_ERROR),
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
      .min(8, INVALID_ERROR)
      .max(15, INVALID_ERROR)
  })
});
