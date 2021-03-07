import React from 'react';
import { Formik, Form } from 'formik';

import { FieldWithUnit } from './components/FieldWithUnit';
import { ICLSchema } from './ICLSchema';
import {
  calcIclSphere,
  calcIclCylindre,
  calcIclAxis,
  calcIclCylindreEquivalent
} from './formulas';
import { PatientInfoFields } from './patient/PatientInfoFields';
import { ICLInputs } from './patient';

interface ContainerProps {
  initialValues: ICLInputs;
}

export const ICLForm: React.FC<ContainerProps> = ({ initialValues }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ICLSchema}
      onSubmit={
        /* istanbul ignore next */
        () => {}
      }
    >
      {({ errors, touched, values, ...otherProps }) => (
        <Form>
          <PatientInfoFields
            values={values}
            errors={errors}
            touched={touched}
            {...otherProps}
          />
          <hr />
          <div className="form-row">
            <div className="col-md-4">
              <h2>Biometrics</h2>
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
                unit="nm"
                error={errors.biometrics?.clr}
                touched={touched.biometrics?.clr}
              />
              <FieldWithUnit
                label="Internal Anterior Chamber Depth (ACQ)"
                name="biometrics.acq"
                unit="mm"
                error={errors.biometrics?.acq}
                touched={touched.biometrics?.acq}
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
            </div>
            <div className="col-md-3 offset-md-1">
              <h2>Spectacle Refraction</h2>
              <FieldWithUnit
                label="Sphere"
                name="spectacleRefraction.sphere"
                unit="dpt"
                error={errors.spectacleRefraction?.sphere}
                touched={touched.spectacleRefraction?.sphere}
              />
              <FieldWithUnit
                label="Cylindre"
                name="spectacleRefraction.cylindre"
                unit="dpt"
                error={errors.spectacleRefraction?.cylindre}
                touched={touched.spectacleRefraction?.cylindre}
              />
              <FieldWithUnit
                label="Axis"
                name="spectacleRefraction.axis"
                unit="º"
                error={errors.spectacleRefraction?.axis}
                touched={touched.spectacleRefraction?.axis}
              />
              <FieldWithUnit
                label="Vertex"
                name="spectacleRefraction.vertex"
                unit="mm"
                error={errors.spectacleRefraction?.vertex}
                touched={touched.spectacleRefraction?.vertex}
              />
            </div>
            <div className="col-md-3 offset-md-1">
              <h2>ICL Power</h2>
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
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};
