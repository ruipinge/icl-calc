import { Field, FormikState } from 'formik';
import { ICLInputs, PreviousSurgery } from '../types';

import { FieldWithUnit } from './FieldWithUnit';

export const CorneaProfile = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'corneaProfile'>>) => (
  <section className="fieldgroup-section">
    <h4>Cornea Profile</h4>
    <div className="fieldgroup">
      <FieldWithUnit
        label="Anterior Keratometry Flat (KAntFlt)"
        name="corneaProfile.kaf"
        unit="dpt"
        error={errors.corneaProfile?.kaf}
        touched={touched.corneaProfile?.kaf}
      />
      <FieldWithUnit
        label="@"
        srLabel="Anterior Keratometry Flat axis"
        axisOf
        name="corneaProfile.axisaf"
        unit="º"
        error={errors.corneaProfile?.axisaf}
        touched={touched.corneaProfile?.axisaf}
      />
      <FieldWithUnit
        label="Anterior Keratometry Steep (KAntStp)"
        name="corneaProfile.kas"
        unit="dpt"
        error={errors.corneaProfile?.kas}
        touched={touched.corneaProfile?.kas}
      />
      <FieldWithUnit
        label="@"
        srLabel="Anterior Keratometry Steep axis"
        axisOf
        name="corneaProfile.axisas"
        unit="º"
        error={errors.corneaProfile?.axisas}
        touched={touched.corneaProfile?.axisas}
      />
      <FieldWithUnit
        label="Posterior Keratometry Flat (KPostFlt)"
        name="corneaProfile.kpf"
        unit="dpt"
        error={errors.corneaProfile?.kpf}
        touched={touched.corneaProfile?.kpf}
      />
      <FieldWithUnit
        label="@"
        srLabel="Posterior Keratometry Flat axis"
        axisOf
        name="corneaProfile.axispf"
        unit="º"
        error={errors.corneaProfile?.axispf}
        touched={touched.corneaProfile?.axispf}
      />
      <FieldWithUnit
        label="Posterior Keratometry Steep (KPostStp)"
        name="corneaProfile.kps"
        unit="dpt"
        error={errors.corneaProfile?.kps}
        touched={touched.corneaProfile?.kps}
      />
      <FieldWithUnit
        label="@"
        srLabel="Posterior Keratometry Steep axis"
        axisOf
        name="corneaProfile.axisps"
        unit="º"
        error={errors.corneaProfile?.axisps}
        touched={touched.corneaProfile?.axisps}
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
