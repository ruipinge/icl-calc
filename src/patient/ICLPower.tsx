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
  <section className="fieldgroup-section">
    <h4>ICL Power</h4>
    <div className="fieldgroup">
      <FieldWithUnit
        label="Sphere"
        qualifier=" (ICL power)"
        name="iclSphere"
        value={calcICLSphere(values)}
        unit="dpt"
        disabled={true}
      />
      <FieldWithUnit
        label="Cylindre"
        qualifier=" (ICL power)"
        name="iclCylindre"
        value={calcICLCylindre(values)}
        unit="dpt"
        disabled={true}
      />
      <FieldWithUnit
        label="Axis"
        qualifier=" (ICL power)"
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
  </section>
);
