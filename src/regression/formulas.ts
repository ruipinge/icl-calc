import { LENS_SIZES_MAP, LensSizeId } from '../matrix/data';

export interface RegressionInfo {
  acd: number;
  ata: number;
  clr: number;
  se: number;
  age: number;
}

interface RegressionExt {
  vaultPredictionVal0: number;
  probExpVal0: number;
  probExpVal1: number;
}

type LensSizeRegressionType = {
  [key in LensSizeId]: RegressionExt;
};

export const RegressionLensSizes: LensSizeRegressionType = {
  small: {
    vaultPredictionVal0: 4132.04 - 260.99,
    probExpVal0: -1.259,
    probExpVal1: -5.829
  },
  medium: {
    vaultPredictionVal0: 4132.04,
    probExpVal0: -1.401,
    probExpVal1: -5.733
  },
  large: {
    vaultPredictionVal0: 4132.04 + 330.19,
    probExpVal0: -2.191,
    probExpVal1: -3.775
  }
};

const vaultPredictionVal1 = (ri: RegressionInfo) =>
  -287.45 * ri.ata + -0.37 * ri.clr + -20.39 * ri.se + -4.82 * ri.age;

const compression = ({
  ata,
  lensSize
}: {
  ata: number;
  lensSize: number;
}): number => ata - lensSize;

const probExpFactor0 = ({
  ri,
  lensSize
}: {
  ri: RegressionInfo;
  lensSize: number;
}) =>
  0.028 * ri.age -
  0.506 * compression({ ata: ri.ata, lensSize: lensSize }) +
  0.005 * ri.clr +
  0.202 * ri.se;

const probExpFactor1 = ({
  ri,
  lensSize
}: {
  ri: RegressionInfo;
  lensSize: number;
}) =>
  -0.076 * ri.age +
  3.721 * compression({ ata: ri.ata, lensSize: lensSize }) +
  0.0 * ri.clr -
  0.164 * ri.se;

export const vaultPrediction = ({
  ri,
  lensSizeId
}: {
  ri: RegressionInfo;
  lensSizeId: LensSizeId;
}): number =>
  RegressionLensSizes[lensSizeId].vaultPredictionVal0 + vaultPredictionVal1(ri);

export const cornea2endothelium = ({
  ri,
  lensSizeId
}: {
  ri: RegressionInfo;
  lensSizeId: LensSizeId;
}): number => ri.acd - (220 + vaultPrediction({ ri, lensSizeId })) / 1000;

export const probability = ({
  ri,
  lensSizeId
}: {
  ri: RegressionInfo;
  lensSizeId: LensSizeId;
}) =>
  1 /
  (1 +
    Math.exp(
      RegressionLensSizes[lensSizeId].probExpVal0 +
        probExpFactor0({ ri: ri, lensSize: LENS_SIZES_MAP[lensSizeId].value })
    ) +
    Math.exp(
      RegressionLensSizes[lensSizeId].probExpVal1 +
        probExpFactor1({ ri: ri, lensSize: LENS_SIZES_MAP[lensSizeId].value })
    ));
