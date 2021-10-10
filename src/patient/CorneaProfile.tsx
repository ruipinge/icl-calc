import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const CorneaProfile = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'corneaProfile'>>) => (
  <div className="section-form">
    <h4>Cornea Profile</h4>
    <FieldWithUnit
      label="Keratometry - Flat Meridian (Kf)"
      name="corneaProfile.kf"
      unit="dpt"
      error={errors.corneaProfile?.kf}
      touched={touched.corneaProfile?.kf}
    />
    <FieldWithUnit
      label="Axis - Flat Meridian"
      name="corneaProfile.kf"
      unit="º"
      error={errors.corneaProfile?.axisf}
      touched={touched.corneaProfile?.axisf}
    />
    <FieldWithUnit
      label="Keratometry - Steep Meridian (Ks)"
      name="corneaProfile.ks"
      unit="dpt"
      error={errors.corneaProfile?.ks}
      touched={touched.corneaProfile?.ks}
    />
    <FieldWithUnit
      label="Axis - Steep Meridian"
      name="corneaProfile.ks"
      unit="º"
      error={errors.corneaProfile?.axiss}
      touched={touched.corneaProfile?.axiss}
    />
    <FieldWithUnit
      label="Central Corneal Thickness (CCT)"
      name="corneaProfile.cct"
      unit="μm"
      error={errors.corneaProfile?.cct}
      touched={touched.corneaProfile?.cct}
    />
    <div className={'form-group row mb-4'}>
      <label htmlFor={'corneaProfile.pcrf'} className="col-sm-6 col-form-label">
        Previous Corneal Refractive Surgery
      </label>
      <div className="col-sm-6">
        <div className="input-group">
          <select
            name="corneaProfile.pcrf"
            className="form-control"
            disabled={true}
            defaultValue={'none'}
          >
            <option value={'none'}>None</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
