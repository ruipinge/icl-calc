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
  ENTER_ERROR = 'Enter a value.';

const formatError = (min: number, max: number) =>
  `${INVALID_ERROR} [${min}, ${max}]`;

// Posterior keratometry is optional, and "not measured" is encoded as 0 both
// by INITIAL_VALUES and by calcRadiusPosterior's `if (kpf && kps)` guard, so
// a plain min/max cannot express the rule: 0 has to stay valid while every
// other sub-floor value - a negative above all - must not.
const formatPosteriorError = (min: number, max: number) =>
  `${formatError(min, max)} or 0 if not measured.`;

// Formik hands Yup `undefined` for a cleared field, but a bare `''` (or NaN,
// or a non-numeric string) can still reach the schema directly; Yup's default
// type error for those is a long "must be a `number` type" sentence. Every
// number schema is built here so each one gets a short, range-bearing message.
const formatEnterError = (min: number, max: number) =>
  `${ENTER_ERROR} [${min}, ${max}]`;

const requiredNumber = (min: number, max: number) =>
  Yup.number()
    .required(formatEnterError(min, max))
    .typeError(formatEnterError(min, max))
    .min(min, formatError(min, max))
    .max(max, formatError(min, max));

// Optional: an empty string means "not entered", same as undefined.
const emptyToUndefined = (value: unknown, original: unknown) =>
  original === '' ? undefined : value;

const optionalNumber = (typeError: string) =>
  Yup.number().transform(emptyToUndefined).optional().typeError(typeError);

const formatPosteriorEnterError = (min: number, max: number) =>
  `${formatEnterError(min, max)} or 0 if not measured.`;

const isUnmeasuredOrInRange =
  (min: number, max: number) => (value: number | undefined) =>
    value === undefined || value === 0 || (value >= min && value <= max);

export const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    dateOfBirth: Yup.date().optional().typeError('Invalid date. (yyyy-mm-dd)')
  }),
  biometry: Yup.object().shape({
    ata: requiredNumber(ATA_MIN, ATA_MAX),
    wtw: requiredNumber(WTW_MIN, WTW_MAX),
    clr: requiredNumber(CLR_MIN, CLR_MAX),
    acd: requiredNumber(ACD_MIN, ACD_MAX),
    acan: requiredNumber(ACA_MIN, ACA_MAX),
    acat: requiredNumber(ACA_MIN, ACA_MAX)
  }),
  corneaProfile: Yup.object().shape({
    kaf: requiredNumber(KA_MIN, KA_MAX),
    kas: requiredNumber(KA_MIN, KA_MAX),
    axisaf: requiredNumber(AXISA_MIN, AXISA_MAX),
    axisas: requiredNumber(AXISA_MIN, AXISA_MAX),
    kpf: optionalNumber(formatPosteriorEnterError(KP_MIN, KP_MAX)).test(
      'posterior-k-or-unmeasured',
      formatPosteriorError(KP_MIN, KP_MAX),
      isUnmeasuredOrInRange(KP_MIN, KP_MAX)
    ),
    kps: optionalNumber(formatPosteriorEnterError(KP_MIN, KP_MAX)).test(
      'posterior-k-or-unmeasured',
      formatPosteriorError(KP_MIN, KP_MAX),
      isUnmeasuredOrInRange(KP_MIN, KP_MAX)
    ),
    axispf: optionalNumber(formatEnterError(AXISP_MIN, AXISP_MAX))
      .min(AXISP_MIN, formatError(AXISP_MIN, AXISP_MAX))
      .max(AXISP_MAX, formatError(AXISP_MIN, AXISP_MAX)),
    axisps: optionalNumber(formatEnterError(AXISP_MIN, AXISP_MAX))
      .min(AXISP_MIN, formatError(AXISP_MIN, AXISP_MAX))
      .max(AXISP_MAX, formatError(AXISP_MIN, AXISP_MAX)),
    cct: requiredNumber(CCT_MIN, CCT_MAX)
  }),
  spectacleRefraction: Yup.object().shape({
    sphere: requiredNumber(SPHERE_MIN, SPHERE_MAX),
    cylindre: requiredNumber(CYLINDRE_MIN, CYLINDRE_MAX),
    axis: requiredNumber(AXIS_MIN, AXIS_MAX),
    vertex: requiredNumber(VERTEX_MIN, VERTEX_MAX)
  })
});
