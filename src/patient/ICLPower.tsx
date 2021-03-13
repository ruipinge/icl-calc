import { FormikState } from 'formik';

import { ICLInputs } from '../types';
import { FieldWithUnit } from './FieldWithUnit';
import {
  calcIclSphere,
  calcIclCylindre,
  calcIclAxis,
  calcIclCylindreEquivalent
} from '../formulas';

export const ICLPower = ({
  errors,
  touched,
  values
}: FormikState<Pick<ICLInputs, 'spectacleRefraction'>>) => (
  <>
    <h4>ICL Power</h4>
    <FieldWithUnit
      label="Sphere"
      name="iclSphere"
      value={calcIclSphere({
        sphere: values.spectacleRefraction.sphere,
        cylindre: values.spectacleRefraction.cylindre
      })}
      unit="dpt"
      disabled={true}
    />
    <FieldWithUnit
      label="Cylindre"
      name="iclCylindre"
      value={calcIclCylindre({
        sphere: values.spectacleRefraction.sphere,
        cylindre: values.spectacleRefraction.cylindre
      })}
      unit="dpt"
      disabled={true}
    />
    <FieldWithUnit
      label="Axis"
      name="iclAxis"
      value={calcIclAxis(values.spectacleRefraction.axis)}
      unit="º"
      disabled={true}
    />
    <FieldWithUnit
      label="Spherical Equivalent"
      value={calcIclCylindreEquivalent({
        sphere: values.spectacleRefraction.sphere,
        cylindre: values.spectacleRefraction.cylindre
      })}
      name="iclSphericalEquivalent"
      unit="º"
      disabled={true}
    />
  </>
);
