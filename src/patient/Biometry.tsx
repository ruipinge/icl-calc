import { FieldWithUnit } from './FieldWithUnit';
import { FormikState } from 'formik';
import { ICLFormValues } from '../types';

export const Biometry = ({
  errors,
  touched
}: FormikState<Pick<ICLFormValues, 'biometry'>>) => (
  <section className="fieldgroup-section">
    <h4>Biometry</h4>
    <div className="fieldgroup">
      <FieldWithUnit
        label="AtA"
        caption="Angle to Angle"
        name="biometry.ata"
        unit="mm"
        error={errors.biometry?.ata}
        touched={touched.biometry?.ata}
      />
      <FieldWithUnit
        label="WtW"
        caption="White to White"
        name="biometry.wtw"
        unit="mm"
        error={errors.biometry?.wtw}
        touched={touched.biometry?.wtw}
      />
      <FieldWithUnit
        label="CLR"
        caption="Crystaline Lens Rise"
        name="biometry.clr"
        unit="μm"
        error={errors.biometry?.clr}
        touched={touched.biometry?.clr}
      />
      <FieldWithUnit
        label="ACD"
        caption="Internal Anterior Chamber Depth"
        name="biometry.acd"
        unit="mm"
        error={errors.biometry?.acd}
        touched={touched.biometry?.acd}
      />
      <FieldWithUnit
        label="ACAn"
        caption="Anterior Chamber Angle nasal"
        name="biometry.acan"
        unit="º"
        error={errors.biometry?.acan}
        touched={touched.biometry?.acan}
      />
      <FieldWithUnit
        label="ACAt"
        caption="Anterior Chamber Angle temporal"
        name="biometry.acat"
        unit="º"
        error={errors.biometry?.acat}
        touched={touched.biometry?.acat}
      />
    </div>
  </section>
);
