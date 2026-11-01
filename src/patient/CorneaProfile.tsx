import { Field, FormikState } from 'formik';
import { ICLFormValues, PreviousSurgery } from '../types';

import { FieldWithUnit } from './FieldWithUnit';
import { KeratometryRow } from './KeratometryRow';

export const CorneaProfile = ({
  errors,
  touched
}: FormikState<Pick<ICLFormValues, 'corneaProfile'>>) => (
  <section className="fieldgroup-section">
    <h4>Cornea Profile</h4>
    <div className="fieldgroup kgroup">
      <KeratometryRow
        label="Anterior Keratometry Flat (KAntFlt)"
        name="corneaProfile.kaf"
        axisSrLabel="Anterior Keratometry Flat axis"
        axisName="corneaProfile.axisaf"
        error={errors.corneaProfile?.kaf}
        touched={touched.corneaProfile?.kaf}
        axisError={errors.corneaProfile?.axisaf}
        axisTouched={touched.corneaProfile?.axisaf}
      />
      <KeratometryRow
        label="Anterior Keratometry Steep (KAntStp)"
        name="corneaProfile.kas"
        axisSrLabel="Anterior Keratometry Steep axis"
        axisName="corneaProfile.axisas"
        error={errors.corneaProfile?.kas}
        touched={touched.corneaProfile?.kas}
        axisError={errors.corneaProfile?.axisas}
        axisTouched={touched.corneaProfile?.axisas}
      />
      <KeratometryRow
        label="Posterior Keratometry Flat (KPostFlt)"
        name="corneaProfile.kpf"
        axisSrLabel="Posterior Keratometry Flat axis"
        axisName="corneaProfile.axispf"
        error={errors.corneaProfile?.kpf}
        touched={touched.corneaProfile?.kpf}
        axisError={errors.corneaProfile?.axispf}
        axisTouched={touched.corneaProfile?.axispf}
      />
      <KeratometryRow
        label="Posterior Keratometry Steep (KPostStp)"
        name="corneaProfile.kps"
        axisSrLabel="Posterior Keratometry Steep axis"
        axisName="corneaProfile.axisps"
        error={errors.corneaProfile?.kps}
        touched={touched.corneaProfile?.kps}
        axisError={errors.corneaProfile?.axisps}
        axisTouched={touched.corneaProfile?.axisps}
      />
      <FieldWithUnit
        label="Central Corneal Thickness (CCT)"
        name="corneaProfile.cct"
        unit="μm"
        error={errors.corneaProfile?.cct}
        touched={touched.corneaProfile?.cct}
      />
      <div className="mrow mrow-select">
        <label htmlFor="corneaProfile.previousSurgery">
          Previous Corneal Refractive Surgery
        </label>
        <Field
          as="select"
          id="corneaProfile.previousSurgery"
          name="corneaProfile.previousSurgery"
        >
          {Object.values(PreviousSurgery).map((val) => (
            <option value={val} key={val}>
              {val}
            </option>
          ))}
        </Field>
      </div>
    </div>
  </section>
);
