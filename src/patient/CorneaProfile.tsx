import { Field, FormikState } from 'formik';
import { ICLInputs, PreviousSurgery } from '../types';

import { FieldWithUnit } from './FieldWithUnit';

export const CorneaProfile = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'corneaProfile'>>) => (
  <div className="section-form">
    <h4>Cornea Profile</h4>
    <FieldWithUnit
      label="Anterior Keratometry Flat (KAntFlt)"
      name="corneaProfile.kaf"
      unit="dpt"
      error={errors.corneaProfile?.kaf}
      touched={touched.corneaProfile?.kaf}
    />
    <FieldWithUnit
      label="@"
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
    <div className={'form-group row mb-4'}>
      <label
        htmlFor={'corneaProfile.previousSurgery'}
        className="col-sm-6 col-form-label"
      >
        Previous Corneal Refractive Surgery
      </label>
      <div className="col-sm-6">
        <div className="input-group">
          <Field
            as="select"
            name="corneaProfile.previousSurgery"
            className="form-control"
          >
            {Object.values(PreviousSurgery).map((val) => (
              <option value={val} key={val}>
                {val}
              </option>
            ))}
          </Field>
        </div>
      </div>
    </div>
  </div>
);
