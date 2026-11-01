import {
  CorneaProfile,
  ICLFormValues,
  ICLInputs,
  PatientInfo,
  PreviousSurgery
} from './types';
import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent,
  calcRadiusPosterior,
  round
} from './formulas';
import { iclPowerInputs } from './missing';

const ICL_VALUES: ICLInputs = {
  patient: new PatientInfo({
    name: '',
    dateOfBirth: '',
    eye: 'left'
  }),
  biometry: {
    ata: 0,
    wtw: 0,
    clr: 0,
    acd: 0,
    acan: 0,
    acat: 0
  },
  corneaProfile: {
    kaf: 0,
    kas: 0,
    kpf: 0,
    kps: 0,
    axisaf: 0,
    axisas: 0,
    axispf: 0,
    axisps: 0,
    cct: 0,
    previousSurgery: PreviousSurgery.none
  },
  spectacleRefraction: {
    sphere: -10,
    cylindre: -4,
    axis: 50,
    vertex: 11
  }
};

const CORNEA_POSTERIOR: CorneaProfile = {
  kaf: 0,
  kas: 0,
  kpf: 1,
  kps: 2,
  axisaf: 0,
  axisas: 0,
  axispf: 0,
  axisps: 0,
  cct: 0,
  previousSurgery: PreviousSurgery.none
};

const CORNEA_PREVIOUS_SURGERY: CorneaProfile = {
  kaf: 1,
  kas: 2,
  kpf: 0,
  kps: 0,
  axisaf: 0,
  axisas: 0,
  axispf: 0,
  axisps: 0,
  cct: 0,
  previousSurgery: PreviousSurgery.hyperopia
};

it('calculates ICL Power Sphere', () => {
  expect(calcICLSphere(ICL_VALUES)).toEqual(-12.19);
});

it('calculates ICL Power Cylindre', () => {
  expect(calcICLCylindre(ICL_VALUES)).toEqual(3.15);
});

it('calculates ICL Power Axis', () => {
  expect(calcICLAxis(0)).toEqual(90);
  expect(calcICLAxis(-0)).toEqual(90);
  expect(calcICLAxis(90)).toEqual(180);
  expect(calcICLAxis(180)).toEqual(90);
  expect(calcICLAxis(1.551)).toEqual(91.6);
  expect(calcICLAxis(1.55)).toEqual(91.6);
  expect(calcICLAxis(1.54)).toEqual(91.5);
  expect(calcICLAxis(91.76)).toEqual(1.8);
  expect(calcICLAxis(-1.29)).toEqual(-1.3);
  expect(calcICLAxis(-1)).toEqual(-1);
  expect(calcICLAxis(-45)).toEqual(-45);
  expect(calcICLAxis(-90)).toEqual(-90);
  expect(calcICLAxis(-180)).toEqual(-180);
  expect(calcICLAxis(-270)).toEqual(-270);
  expect(calcICLAxis(NaN)).toEqual(NaN);
});

it('calculates ICL Power Cylindre Equivalent', () => {
  expect(calcICLSphericalEquivalent(ICL_VALUES)).toEqual(-10.64);
});

it('calculates Radius Posterior Cornea', () => {
  expect(round(calcRadiusPosterior(CORNEA_POSTERIOR), 5)).toEqual(0.02667);
  expect(round(calcRadiusPosterior(CORNEA_PREVIOUS_SURGERY), 5)).toEqual(0.189);
});

/*
 * An empty posterior keratometry field reaches the formulas as 0 (see
 * iclPowerInputs in src/missing.ts). That is safe only because the
 * `if (kpf && kps)` guard treats '' and 0 alike - both falsy - so neither
 * a missing reading nor a 0 is ever used as a posterior power. Pinned here
 * for each previous-surgery branch and each one-of-two case.
 */
describe("posterior keratometry: '' and 0 are the same", () => {
  const empty = '' as unknown as number;
  const cases: [string, number, number][] = [
    ['both', 0, 0],
    ['flat only', 6.1, 0],
    ['steep only', 0, 6.4]
  ];
  const inputs = (
    previousSurgery: PreviousSurgery,
    kpf: number,
    kps: number
  ): ICLInputs => ({
    ...ICL_VALUES,
    biometry: { ...ICL_VALUES.biometry, acd: 3.2 },
    corneaProfile: {
      ...ICL_VALUES.corneaProfile,
      kaf: 43,
      kas: 44.5,
      cct: 540,
      kpf,
      kps,
      previousSurgery
    }
  });
  // Blank in the form: each 0 in the case replaced by ''.
  const blank = (k: number) => (k === 0 ? empty : k);

  describe.each([PreviousSurgery.none, PreviousSurgery.myopia])(
    'previous surgery %s',
    (surgery) => {
      it.each(cases)('missing %s', (_, kpf, kps) => {
        const zero = inputs(surgery, kpf, kps);
        const form = inputs(surgery, blank(kpf), blank(kps));

        expect(calcICLSphere(form)).toBe(calcICLSphere(zero));
        expect(calcICLCylindre(form)).toBe(calcICLCylindre(zero));
        expect(calcICLSphericalEquivalent(form)).toBe(
          calcICLSphericalEquivalent(zero)
        );
        expect(calcRadiusPosterior(form.corneaProfile)).toBe(
          calcRadiusPosterior(zero.corneaProfile)
        );
        expect(Number.isFinite(calcICLSphere(zero))).toBe(true);
      });
    }
  );

  it('iclPowerInputs turns an empty pair into 0, and ICL Power agrees', () => {
    const form: ICLFormValues = {
      ...inputs(PreviousSurgery.none, 0, 0),
      corneaProfile: {
        ...inputs(PreviousSurgery.none, 0, 0).corneaProfile,
        kpf: '',
        kps: ''
      }
    };
    const normalised = iclPowerInputs(form);

    expect(normalised?.corneaProfile.kpf).toBe(0);
    expect(normalised?.corneaProfile.kps).toBe(0);
    expect(normalised && calcICLSphere(normalised)).toBe(
      calcICLSphere(inputs(PreviousSurgery.none, 0, 0))
    );
  });
});
