const calcPosMeridian = (sphere: number) => {
    return -1.33756 + (0.9446 * sphere);
};

const calcNegMeridian = (sphere: number, cylinder: number) => {
    return -1.33756 + (0.9446 * (sphere + cylinder));
};

export const calcIclSphere = (sphere: number, cylinder: number) => {
    return calcNegMeridian(sphere, cylinder);
};

export const calcIclCylinder = (sphere: number, cylinder: number) => {
    const posMer = calcPosMeridian(sphere),
      negMer = calcNegMeridian(sphere, cylinder);

    return posMer - negMer;
};

export const calcIclAxis = (axis: number) => {
  if (axis >= 0 && axis < 90) {
    return axis + 90;
  }
  
  if (axis > 90 && axis <= 180) {
    return axis - 90;
  }
  
  return axis;
}

export const calcIclCylinderEquivalent = (sphere: number, cylinder: number) => {
  const negCylinder = calcNegMeridian(sphere, cylinder) - calcPosMeridian(sphere);
  return calcPosMeridian(sphere) + (negCylinder / 2);
}