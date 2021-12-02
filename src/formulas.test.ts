import {
  CorneaProfile,
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
