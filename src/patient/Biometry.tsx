import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';

export const Biometry = ({
  errors,
  touched
}: FormikState<Pick<ICLInputs, 'biometry'>>) => (
  <>
    <h4>Biometry</h4>
    <FieldWithUnit
      label="Angle to Angle (AtA)"
      name="biometry.ata"
      unit="mm"
      error={errors.biometry?.ata}
      touched={touched.biometry?.ata}
    />
    <FieldWithUnit
      label="White to White (WtW)"
      name="biometry.wtw"
      unit="mm"
      error={errors.biometry?.wtw}
      touched={touched.biometry?.wtw}
    />
    <FieldWithUnit
      label="Crystaline Lens Rise (CLR)"
      name="biometry.clr"
      unit="μm"
      error={errors.biometry?.clr}
      touched={touched.biometry?.clr}
    />
    <FieldWithUnit
      label="Internal Anterior Chamber Depth (ACD)"
      name="biometry.acd"
      unit="mm"
      error={errors.biometry?.acd}
      touched={touched.biometry?.acd}
    />
    <FieldWithUnit
      label="Anterior Chamber Angle nasal (ACAn)"
      name="biometry.acan"
      unit="º"
      error={errors.biometry?.acan}
      touched={touched.biometry?.acan}
    />
    <FieldWithUnit
      label="Anterior Chamber Angle temporal (ACAt)"
      name="biometry.acat"
      unit="º"
      error={errors.biometry?.acat}
      touched={touched.biometry?.acat}
    />
    <FieldWithUnit
      label="Keratometry - Flat Meridian (Kf)"
      name="biometry.kf"
      unit="dpt"
      error={errors.biometry?.kf}
      touched={touched.biometry?.kf}
    />
    <FieldWithUnit
      label="Central Corneal Thickness (CCT)"
      name="biometry.cct"
      unit="μm"
      error={errors.biometry?.cct}
      touched={touched.biometry?.cct}
    />
  </>
);
