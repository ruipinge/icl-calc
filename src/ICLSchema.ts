import * as Yup from 'yup';

const ATA_MIN = 0,
  ATA_MAX = 20,
  WTW_MIN = 0,
  WTW_MAX = 20,
  CLR_MIN = -1000,
  CLR_MAX = 1000,
  ACD_MIN = 2.7,
  ACD_MAX = 6.0,
  ACA_MIN = 0,
  ACA_MAX = 70,
  KA_MIN = 30,
  KA_MAX = 55,
  AXISA_MIN = 0,
  AXISA_MAX = 180,
  CCT_MIN = 300,
  CCT_MAX = 700,
  SPHERE_MIN = -25,
  SPHERE_MAX = 0,
  CYLINDRE_MIN = -8,
  CYLINDRE_MAX = 0,
  AXIS_MIN = 0,
  AXIS_MAX = 180,
  VERTEX_MIN = 8,
  VERTEX_MAX = 15,
  INVALID_ERROR = 'Invalid value.',
  REQUIRED_ERROR = 'Required value.';

const formatError = (min: number, max: number) =>
  `${INVALID_ERROR} [${min}, ${max}]`;

export const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    dateOfBirth: Yup.date().optional().typeError('Invalid date. (yyyy-mm-dd)')
  }),
  biometry: Yup.object().shape({
    ata: Yup.number()
      .required(REQUIRED_ERROR)
      .min(ATA_MIN, formatError(ATA_MIN, ATA_MAX))
      .max(ATA_MAX, formatError(ATA_MIN, ATA_MAX)),
    wtw: Yup.number()
      .required(REQUIRED_ERROR)
      .min(WTW_MIN, formatError(WTW_MIN, WTW_MAX))
      .max(WTW_MAX, formatError(WTW_MIN, WTW_MAX)),
    clr: Yup.number()
      .required(REQUIRED_ERROR)
      .min(CLR_MIN, formatError(CLR_MIN, CLR_MAX))
      .max(CLR_MAX, formatError(CLR_MIN, CLR_MAX)),
    acd: Yup.number()
      .required(REQUIRED_ERROR)
      .min(ACD_MIN, formatError(ACD_MIN, ACD_MAX))
      .max(ACD_MAX, formatError(ACD_MIN, ACD_MAX)),
    acan: Yup.number()
      .required(REQUIRED_ERROR)
      .min(ACA_MIN, formatError(ACA_MIN, ACA_MAX))
      .max(ACA_MAX, formatError(ACA_MIN, ACA_MAX)),
    acat: Yup.number()
      .required(REQUIRED_ERROR)
      .min(ACA_MIN, formatError(ACA_MIN, ACA_MAX))
      .max(ACA_MAX, formatError(ACA_MIN, ACA_MAX))
  }),
  corneaProfile: Yup.object().shape({
    kaf: Yup.number()
      .required(REQUIRED_ERROR)
      .min(KA_MIN, formatError(KA_MIN, KA_MAX))
      .max(KA_MAX, formatError(KA_MIN, KA_MAX)),
    kas: Yup.number()
      .required(REQUIRED_ERROR)
      .min(KA_MIN, formatError(KA_MIN, KA_MAX))
      .max(KA_MAX, formatError(KA_MIN, KA_MAX)),
    axisaf: Yup.number()
      .required(REQUIRED_ERROR)
      .min(AXISA_MIN, formatError(AXISA_MIN, AXISA_MAX))
      .max(AXISA_MAX, formatError(AXISA_MIN, AXISA_MAX)),
    axisas: Yup.number()
      .required(REQUIRED_ERROR)
      .min(AXISA_MIN, formatError(AXISA_MIN, AXISA_MAX))
      .max(AXISA_MAX, formatError(AXISA_MIN, AXISA_MAX)),
    cct: Yup.number()
      .required(REQUIRED_ERROR)
      .min(CCT_MIN, formatError(CCT_MIN, CCT_MAX))
      .max(CCT_MAX, formatError(CCT_MIN, CCT_MAX))
  }),
  spectacleRefraction: Yup.object().shape({
    sphere: Yup.number()
      .required(REQUIRED_ERROR)
      .min(SPHERE_MIN, formatError(SPHERE_MIN, SPHERE_MAX))
      .max(SPHERE_MAX, formatError(SPHERE_MIN, SPHERE_MAX)),
    cylindre: Yup.number()
      .required(REQUIRED_ERROR)
      .min(CYLINDRE_MIN, formatError(CYLINDRE_MIN, CYLINDRE_MAX))
      .max(CYLINDRE_MAX, formatError(CYLINDRE_MIN, CYLINDRE_MAX)),
    axis: Yup.number()
      .required(REQUIRED_ERROR)
      .min(AXIS_MIN, formatError(AXIS_MIN, AXIS_MAX))
      .max(AXIS_MAX, formatError(AXIS_MIN, AXIS_MAX)),
    vertex: Yup.number()
      .required(REQUIRED_ERROR)
      .min(VERTEX_MIN, formatError(VERTEX_MIN, VERTEX_MAX))
      .max(VERTEX_MAX, formatError(VERTEX_MIN, VERTEX_MAX))
  })
});
