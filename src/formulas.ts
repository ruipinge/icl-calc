const FACTOR0 = -1.33756,
  FACTOR1 = 0.9446;

export const round = (val: number, decimals: number = 2) =>
  Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const calcPosMeridian = (sphere: number) => {
  return FACTOR0 + FACTOR1 * sphere;
};

export const calcNegMeridian = ({
  sphere,
  cylindre
}: {
  sphere: number;
  cylindre: number;
}) => {
  return FACTOR0 + FACTOR1 * (sphere + cylindre);
};

export const calcIclSphere = ({
  sphere,
  cylindre
}: {
  sphere: number;
  cylindre: number;
}) => {
  return round(calcNegMeridian({ sphere: sphere, cylindre: cylindre }));
};

export const calcIclCylindre = ({
  sphere,
  cylindre
}: {
  sphere: number;
  cylindre: number;
}) => {
  const posMer = calcPosMeridian(sphere),
    negMer = calcNegMeridian({ sphere: sphere, cylindre: cylindre });

  return round(posMer - negMer);
};

export const calcIclAxis = (axis: number) => {
  if (axis >= 0 && axis < 90) {
    return round(axis + 90, 1);
  }

  if (axis > 90 && axis <= 180) {
    return round(axis - 90, 1);
  }

  return round(axis, 1);
};

export const calcIclSphericalEquivalent = ({
  sphere,
  cylindre
}: {
  sphere: number;
  cylindre: number;
}) => {
  const negCylindre =
    calcNegMeridian({ sphere: sphere, cylindre: cylindre }) -
    calcPosMeridian(sphere);
  return round(calcPosMeridian(sphere) + negCylindre / 2);
};
