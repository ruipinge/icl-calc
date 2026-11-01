import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent
} from '../formulas';

import { iclPowerInputs, measurement } from '../missing';

import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLFormValues } from '../types';

/*
 * Each output is blank, not a number, while an input it depends on is
 * missing: Sphere, Cylindre and SE need every ICL power field, Axis only the
 * refraction axis. With every input present they are exactly the formulas'.
 */
export const ICLPower = ({ values }: FormikState<ICLFormValues>) => {
  const inputs = iclPowerInputs(values);
  const axis = measurement(values.spectacleRefraction.axis);

  return (
    <section className="fieldgroup-section">
      <h4>ICL Power</h4>
      <div className="fieldgroup">
        <FieldWithUnit
          label="Sphere"
          qualifier=" (ICL power)"
          name="iclSphere"
          value={inputs === undefined ? '' : calcICLSphere(inputs)}
          unit="dpt"
          disabled={true}
        />
        <FieldWithUnit
          label="Cylindre"
          qualifier=" (ICL power)"
          name="iclCylindre"
          value={inputs === undefined ? '' : calcICLCylindre(inputs)}
          unit="dpt"
          disabled={true}
        />
        <FieldWithUnit
          label="Axis"
          qualifier=" (ICL power)"
          name="iclAxis"
          value={axis === undefined ? '' : calcICLAxis(axis)}
          unit="º"
          disabled={true}
        />
        <FieldWithUnit
          label="Spherical Equivalent (SE)"
          value={inputs === undefined ? '' : calcICLSphericalEquivalent(inputs)}
          name="iclSphericalEquivalent"
          unit="dpt"
          disabled={true}
        />
      </div>
    </section>
  );
};
