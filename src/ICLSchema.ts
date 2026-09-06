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
  // Posterior keratometry is entered as a POSITIVE dioptric power. Several
  // biometers report it signed (e.g. -6.20); entering that sign flips the
  // sign of the posterior corneal power in calcRadiusPosterior and silently
  // yields a plausible-but-wrong ICL Power, which is why the floor is above
  // zero rather than a bare `min(0)`.
  //
  // The bounds are the app's own: calcRadiusPosterior's fallback estimates
  // the posterior radius as anterior x 0.84, so a schema-legal anterior
  // cornea (KA_MIN..KA_MAX) implies a posterior power of
  // 0.04 / (0.3375 / KA * 0.84), i.e. ~4.23 D at KA 30 and ~7.76 D at KA 55.
  // Rounded outwards to [4, 8] so the schema can never reject a posterior K
  // that the calculator itself would have estimated, while still rejecting
  // an anterior K typed into a posterior field.
  KP_MIN = 4.0,
  KP_MAX = 8.0,
  AXISP_MIN = 0,
  AXISP_MAX = 180,
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

// Posterior keratometry is optional, and "not measured" is encoded as 0 both
// by INITIAL_VALUES and by calcRadiusPosterior's `if (kpf && kps)` guard, so
// a plain min/max cannot express the rule: 0 has to stay valid while every
// other sub-floor value - a negative above all - must not.
const formatPosteriorError = (min: number, max: number) =>
  `${formatError(min, max)} or 0 if not measured.`;

const isUnmeasuredOrInRange = (min: number, max: number) => (
  value: number | undefined
) => value === undefined || value === 0 || (value >= min && value <= max);

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
    kpf: Yup.number()
      .optional()
      .test(
        'posterior-k-or-unmeasured',
        formatPosteriorError(KP_MIN, KP_MAX),
        isUnmeasuredOrInRange(KP_MIN, KP_MAX)
      ),
    kps: Yup.number()
      .optional()
      .test(
        'posterior-k-or-unmeasured',
        formatPosteriorError(KP_MIN, KP_MAX),
        isUnmeasuredOrInRange(KP_MIN, KP_MAX)
      ),
    axispf: Yup.number()
      .optional()
      .min(AXISP_MIN, formatError(AXISP_MIN, AXISP_MAX))
      .max(AXISP_MAX, formatError(AXISP_MIN, AXISP_MAX)),
    axisps: Yup.number()
      .optional()
      .min(AXISP_MIN, formatError(AXISP_MIN, AXISP_MAX))
      .max(AXISP_MAX, formatError(AXISP_MIN, AXISP_MAX)),
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
