import { CorneaProfile, ICLInputs, PreviousSurgery } from './types';

export const round = (val: number, decimals: number = 2) =>
  Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);

/**
 * Constants
 */
const nAir = 1.0;
const nCornea = 1.376;
const nAqueous = 1.336;
const vault = 500 * 1e-3;
const ratioCorneaNormal = 0.84;

/**
 * Transformations
 */
const adjustVertex = (vertex: number) => vertex * 1e-3;
const adjustCct = (cct: number) => cct * 1e-6;
const calcSe = ({ sphere, cylinder }: { sphere: number; cylinder: number }) =>
  sphere + cylinder / 2;
const calcKmAnt = ({ kaf, kas }: { kaf: number; kas: number }) =>
  (kaf + kas) / 2;
const calcRadiusAnterior = ({ kaf, kas }: { kaf: number; kas: number }) =>
  (1.3375 - 1) / calcKmAnt({ kaf, kas });

/**
 * Posterior Cornea
 */
export const calcRadiusPosterior = (corneaProfile: CorneaProfile) => {
  // If user inserts K Post Flt & K Post Stp then
  if (corneaProfile.kpf && corneaProfile.kps) {
    const kmPost = (corneaProfile.kpf + corneaProfile.kps) / 2;
    return (1.376 - 1.336) / kmPost;
  }

  // Else if user does not insert K Post Flt & K Post Stp AND Corneal refractive Surgery is No Treatment
  if (corneaProfile.previousSurgery === PreviousSurgery.none) {
    return (
      calcRadiusAnterior({ kaf: corneaProfile.kaf, kas: corneaProfile.kas }) *
      ratioCorneaNormal
    );
  }

  // Else if user does not insert K Post Flt & K Post Stp AND Corneal refractive Surgery is Myopia or Hyperopia
  // TODO: And display a Warning:
  // "ICL Power calculation may not be accurate because cornea surface ratio used may not reflect the patient’s corneal geometry, consider introducing the posterior corneal curvatures"
  return (
    calcRadiusAnterior({ kaf: corneaProfile.kaf, kas: corneaProfile.kas }) *
    ratioCorneaNormal
  );
};

/**
 * Calculating True cornea power
 */
const calcPAntCornea = ({ kaf, kas }: { kaf: number; kas: number }) =>
  (1.376 - 1) / calcRadiusAnterior({ kaf, kas });
const calcPPostCornea = (corneaProfile: CorneaProfile) =>
  (1.336 - 1.376) / calcRadiusPosterior(corneaProfile);

/**
 * Vergence at the ICL plane
 */
export const calcVergence = (l0exit: number, iclInputs: ICLInputs) => {
  const sr = iclInputs.spectacleRefraction;
  const corneaProfile = iclInputs.corneaProfile;
  const biometry = iclInputs.biometry;

  const l1entrance = l0exit / (1 - (adjustVertex(sr.vertex) * l0exit) / nAir);
  const l1exit = l1entrance + calcPAntCornea(corneaProfile);
  const l2entrance =
    l1exit / (1 - (adjustCct(corneaProfile.cct) * l1exit) / nCornea);
  const l2exit = l2entrance + calcPPostCornea(corneaProfile);
  return l2exit / (1 - ((biometry.acd - vault) * 1e-3 * l2exit) / nAqueous);
};

/**
 * ICL Power
 */
export const calcICLPower = (iclInputs: ICLInputs) => {
  const corneaProfile = iclInputs.corneaProfile;
  const biometry = iclInputs.biometry;

  const l1exit_ = calcPAntCornea(corneaProfile);
  const l2entrance_ =
    l1exit_ / (1 - (adjustCct(corneaProfile.cct) * l1exit_) / nCornea);
  const l2exit_ = l2entrance_ + calcPPostCornea(corneaProfile);
  return l2exit_ / (1 - ((biometry.acd - vault) * 1e-3 * l2exit_) / nAqueous);
};

/**
 * Calculate the ICL SE
 */
export const calcPiclSphericalEquivalent = (iclInputs: ICLInputs) => {
  const sr = iclInputs.spectacleRefraction;
  const se = calcSe({ sphere: sr.sphere, cylinder: sr.cylindre });
  return calcVergence(se, iclInputs) - calcICLPower(iclInputs);
};

/**
 * Calculate the ICL Sphere Meridian
 */
export const calcPiclSphere = (iclInputs: ICLInputs) => {
  const sr = iclInputs.spectacleRefraction;
  return calcVergence(sr.sphere, iclInputs) - calcICLPower(iclInputs);
};

/**
 * Calculate the ICL Cylinder Meridian
 */
export const calcPiclCylindre = (iclInputs: ICLInputs) => {
  const sr = iclInputs.spectacleRefraction;
  return (
    calcVergence(sr.sphere + sr.cylindre, iclInputs) - calcICLPower(iclInputs)
  );
};

export const calcICLSphere = (iclInputs: ICLInputs) =>
  round(calcPiclCylindre(iclInputs));

export const calcICLCylindre = (iclInputs: ICLInputs) =>
  round(calcPiclSphere(iclInputs) - calcPiclCylindre(iclInputs));

export const calcICLSphericalEquivalent = (iclInputs: ICLInputs) =>
  round(calcPiclSphericalEquivalent(iclInputs));

export const calcICLAxis = (axis: number) => {
  if (axis >= 0 && axis <= 90) {
    return round(axis + 90, 1);
  }

  if (axis > 90 && axis <= 180) {
    return round(axis - 90, 1);
  }

  return round(axis, 1);
};
