import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent
} from '../formulas';

import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const ICLPower = ({
  errors,
  touched,
  values
}: FormikState<ICLInputs>) => (
  <div>
    <h4>ICL Power</h4>
    <FieldWithUnit
      label="Sphere"
      name="iclSphere"
      value={calcICLSphere(values)}
      unit="dpt"
      disabled={true}
    />
    <FieldWithUnit
      label="Cylindre"
      name="iclCylindre"
      value={calcICLCylindre(values)}
      unit="dpt"
      disabled={true}
    />
    <FieldWithUnit
      label="Axis"
      name="iclAxis"
      value={calcICLAxis(values.spectacleRefraction.axis)}
      unit="º"
      disabled={true}
    />
    <FieldWithUnit
      label="Spherical Equivalent (SE)"
      value={calcICLSphericalEquivalent(values)}
      name="iclSphericalEquivalent"
      unit="dpt"
      disabled={true}
    />
  </div>
);
