/*
function calcPosMeridian(sphere) {
    return -1.33756 + (0.9446 * sphere);
};

function calcNegMeridian(sphere, cylinder) {
    return -1.33756 + (0.9446 * (sphere + cylinder));
};

export const iclSphere = selector({
  key: 'iclSphere',
  get: ({get}) => {
    const val = get(patientState);
    const val = get(biometricsState),
      negMer = calcNegMeridian(val.sphere, val.cylinder);

    return `${val.name} (${val.dateOfBirth}), ${val.age} years old, ${val.eye} eye`;
    return Number((negMer).toFixed(2));
  }
});

export const iclCylinder = selector({
  key: 'iclCylinder',
  get: ({get}) => {
    const val = get(biometricsState),
      posMer = calcPosMeridian(val.sphere),
      negMer = calcPosMeridian(val.sphere, val.cylinder);

    return Number((posMer - negMer).toFixed(2));
  }

});

export const iclAxis = selector({
  key: 'iclAxis',
  get: ({get}) => {
    const val = get(biometricsState),
      axis = val.axis;

    // ICl axis
    if (axis >= 0 && axis <= 90) {
      return axis + 90;
    } else if (axis >=91 && axis <= 180) {
      // TODO: this looks like a bug
      return axis + 90;
    }

    return axis;
  }
 */

export default null;