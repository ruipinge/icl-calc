import {
  calcIclAxis,
  calcIclCylindre,
  calcIclCylindreEquivalent,
  calcIclSphere
} from './formulas';

it('calculates ICL Power Sphere', () => {
  expect(calcIclSphere({ sphere: 0, cylindre: 0 })).toEqual(-1.34);
  expect(calcIclSphere({ sphere: -1, cylindre: -1 })).toEqual(-3.23);
  expect(calcIclSphere({ sphere: 1, cylindre: 1 })).toEqual(0.55);
  expect(calcIclSphere({ sphere: -25, cylindre: 0 })).toEqual(-24.95);
  expect(calcIclSphere({ sphere: -25, cylindre: -8 })).toEqual(-32.51);
  expect(calcIclSphere({ sphere: -12.567, cylindre: -4.1267 })).toEqual(-17.11);
  expect(calcIclSphere({ sphere: 0, cylindre: -8 })).toEqual(-8.89);
  expect(calcIclSphere({ sphere: NaN, cylindre: -8 })).toBe(NaN);
  expect(calcIclSphere({ sphere: NaN, cylindre: NaN })).toBe(NaN);
  expect(calcIclSphere({ sphere: 0, cylindre: NaN })).toBe(NaN);
});

it('calculates ICL Power Cylindre', () => {
  expect(calcIclCylindre({ sphere: 0, cylindre: 0 })).toEqual(0);
  expect(calcIclCylindre({ sphere: -1, cylindre: -1 })).toEqual(0.94);
  expect(calcIclCylindre({ sphere: 1, cylindre: 1 })).toEqual(-0.94);
  expect(calcIclCylindre({ sphere: -25, cylindre: 0 })).toEqual(0);
  expect(calcIclCylindre({ sphere: -25, cylindre: -8 })).toEqual(7.56);
  expect(calcIclCylindre({ sphere: 0, cylindre: -8 })).toEqual(7.56);
  expect(calcIclCylindre({ sphere: NaN, cylindre: -8 })).toBe(NaN);
  expect(calcIclCylindre({ sphere: NaN, cylindre: NaN })).toBe(NaN);
  expect(calcIclCylindre({ sphere: 0, cylindre: NaN })).toBe(NaN);
});

it('calculates ICL Power Axis', () => {
  expect(calcIclAxis(0)).toEqual(90);
  expect(calcIclAxis(-0)).toEqual(90);
  expect(calcIclAxis(90)).toEqual(90);
  expect(calcIclAxis(180)).toEqual(90);
  expect(calcIclAxis(1.551)).toEqual(91.6);
  expect(calcIclAxis(1.55)).toEqual(91.6);
  expect(calcIclAxis(1.54)).toEqual(91.5);
  expect(calcIclAxis(91.76)).toEqual(1.8);
  expect(calcIclAxis(-1.29)).toEqual(-1.3);
  expect(calcIclAxis(-1)).toEqual(-1);
  expect(calcIclAxis(-45)).toEqual(-45);
  expect(calcIclAxis(-90)).toEqual(-90);
  expect(calcIclAxis(-180)).toEqual(-180);
  expect(calcIclAxis(-270)).toEqual(-270);
  expect(calcIclAxis(NaN)).toEqual(NaN);
});

it('calculates ICL Power Cylindre Equivalent', () => {
  expect(calcIclCylindreEquivalent({ sphere: 0, cylindre: 0 })).toEqual(-1.34);
  expect(calcIclCylindreEquivalent({ sphere: 10, cylindre: 10 })).toEqual(
    12.83
  );
  expect(calcIclCylindreEquivalent({ sphere: -25, cylindre: -8 })).toEqual(
    -28.73
  );
  expect(calcIclCylindreEquivalent({ sphere: -25, cylindre: 0 })).toEqual(
    -24.95
  );
  expect(calcIclCylindreEquivalent({ sphere: 0, cylindre: -8 })).toEqual(-5.12);
});
