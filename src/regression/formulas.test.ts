import {
  RegressionInfo,
  cornea2endothelium,
  probability,
  vaultPrediction
} from './formulas';

import { round } from '../formulas';

export const RI: RegressionInfo = {
  acd: 3.41,
  ata: 11.72,
  clr: -80,
  se: -1.34,
  age: 23
};

const vault126 = (ri: RegressionInfo) =>
  4132.04 -
  260.99 +
  -287.45 * ri.ata +
  -0.37 * ri.clr +
  -20.39 * ri.se +
  -4.82 * ri.age;

const vault132 = (ri: RegressionInfo) =>
  4132.04 + -287.45 * RI.ata + -0.37 * RI.clr + -20.39 * RI.se + -4.82 * RI.age;

const vault137 = (ri: RegressionInfo) =>
  4132.04 +
  330.19 +
  -287.45 * RI.ata +
  -0.37 * RI.clr +
  -20.39 * RI.se +
  -4.82 * RI.age;

it('calculates vault prediction for small lens size', () => {
  expect(round(vault126(RI), 5)).toEqual(
    round(vaultPrediction({ ri: RI, lensSizeId: 'small' }), 5)
  );
});

it('calculates vault prediction for medium lens size', () => {
  expect(round(vault132(RI), 5)).toEqual(
    round(vaultPrediction({ ri: RI, lensSizeId: 'medium' }), 5)
  );
});

it('calculates vault prediction for large lens size', () => {
  expect(round(vault137(RI), 5)).toEqual(
    round(vaultPrediction({ ri: RI, lensSizeId: 'large' }), 5)
  );
});

it('calculates corneal endothelium to ICL for small lens size', () => {
  const expected = RI.acd - (220 + vault126(RI)) / 1000;
  expect(round(expected, 5)).toEqual(
    round(cornea2endothelium({ ri: RI, lensSizeId: 'small' }), 5)
  );
});

it('calculates corneal endothelium to ICL for medium lens size', () => {
  const expected = RI.acd - (220 + vault132(RI)) / 1000;
  expect(round(expected, 5)).toEqual(
    round(cornea2endothelium({ ri: RI, lensSizeId: 'medium' }), 5)
  );
});

it('calculates corneal endothelium to ICL for large lens size', () => {
  const expected = RI.acd - (220 + vault137(RI)) / 1000;
  expect(round(expected, 5)).toEqual(
    round(cornea2endothelium({ ri: RI, lensSizeId: 'large' }), 5)
  );
});

it('calculates probability for small lens size', () => {
  const compression126 = 12.6 - RI.ata;
  const expected =
    1 /
    (1 +
      Math.exp(
        -1.259 +
          0.028 * RI.age -
          0.506 * compression126 +
          0.005 * RI.clr +
          0.202 * RI.se
      ) +
      Math.exp(
        -5.829 -
          0.076 * RI.age +
          3.721 * compression126 +
          0.0 * RI.clr -
          0.164 * RI.se
      ));

  expect(round(expected, 5)).toEqual(
    round(
      probability({
        ri: RI,
        lensSizeId: 'small'
      }),
      5
    )
  );
});

it('calculates probability for medium lens size', () => {
  const compression132 = 13.2 - RI.ata;
  const expected =
    1 /
    (1 +
      Math.exp(
        -1.401 +
          0.028 * RI.age -
          0.506 * compression132 +
          0.005 * RI.clr +
          0.202 * RI.se
      ) +
      Math.exp(
        -5.733 -
          0.076 * RI.age +
          3.721 * compression132 +
          0.0 * RI.clr -
          0.164 * RI.se
      ));

  expect(round(expected, 5)).toEqual(
    round(
      probability({
        ri: RI,
        lensSizeId: 'medium'
      }),
      5
    )
  );
});

it('calculates probability for large lens size', () => {
  const compression137 = 13.7 - RI.ata;
  const expected =
    1 /
    (1 +
      Math.exp(
        -2.191 +
          0.028 * RI.age -
          0.506 * compression137 +
          0.005 * RI.clr +
          0.202 * RI.se
      ) +
      Math.exp(
        -3.775 -
          0.076 * RI.age +
          3.721 * compression137 +
          0.0 * RI.clr -
          0.164 * RI.se
      ));

  expect(round(expected, 5)).toEqual(
    round(
      probability({
        ri: RI,
        lensSizeId: 'large'
      }),
      5
    )
  );
});
