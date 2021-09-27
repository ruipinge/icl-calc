import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const Biometrics = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'biometrics'>>) => (
  <>
    <h4>Biometrics</h4>
    <FieldWithUnit
      label="Angle to Angle (AtA)"
      name="biometrics.ata"
      unit="mm"
      error={errors.biometrics?.ata}
      touched={touched.biometrics?.ata}
    />
    <FieldWithUnit
      label="White to White (WtW)"
      name="biometrics.wtw"
      unit="mm"
      error={errors.biometrics?.wtw}
      touched={touched.biometrics?.wtw}
    />
    <FieldWithUnit
      label="Crystaline Lens Rise (CLR)"
      name="biometrics.clr"
      unit="μm"
      error={errors.biometrics?.clr}
      touched={touched.biometrics?.clr}
    />
    <FieldWithUnit
      label="Internal Anterior Chamber Depth (ACD)"
      name="biometrics.acd"
      unit="mm"
      error={errors.biometrics?.acd}
      touched={touched.biometrics?.acd}
    />
    <FieldWithUnit
      label="Anterior Chamber Angle nasal (ACAn)"
      name="biometrics.acan"
      unit="º"
      error={errors.biometrics?.acan}
      touched={touched.biometrics?.acan}
    />
    <FieldWithUnit
      label="Anterior Chamber Angle temporal (ACAt)"
      name="biometrics.acat"
      unit="º"
      error={errors.biometrics?.acat}
      touched={touched.biometrics?.acat}
    />
    <FieldWithUnit
      label="Keratometry - Flat Meridian (Kf)"
      name="biometrics.kf"
      unit="dpt"
      error={errors.biometrics?.kf}
      touched={touched.biometrics?.kf}
    />
    <FieldWithUnit
      label="Central Corneal Thickness (CCT)"
      name="biometrics.cct"
      unit="μm"
      error={errors.biometrics?.cct}
      touched={touched.biometrics?.cct}
    />
  </>
);
