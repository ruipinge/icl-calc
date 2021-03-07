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
import { PatientInfo, PatientInfoFields } from './patient/PatientInfoFields';

interface Biometrics {
  ata: number;
  wtw: number;
  clr: number;
  acq: number;
  acan: number;
  acat: number;
  kf: number;
  cct: number;
}

interface SpectacleRefraction {
  sphere: number;
  cylindre: number;
  axis: number;
  vertex: number;
}

export interface ICLInputs {
  patient: PatientInfo;
  biometrics: Biometrics;
  spectacleRefraction: SpectacleRefraction;
}

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
            values={values.patient}
            errors={errors.patient}
            touched={touched.patient}
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
              />
              <FieldWithUnit
                label="White to White (WtW)"
                name="biometrics.wtw"
                unit="mm"
                unitTitle="millimetres"
                error={errors.biometrics?.wtw}
              />
              <FieldWithUnit
                label="Crystaline Lens Rise (CLR)"
                name="biometrics.clr"
                unit="nm"
                unitTitle="nanometres"
                error={errors.biometrics?.clr}
              />
              <FieldWithUnit
                label="Internal Anterior Chamber Depth (ACQ)"
                name="biometrics.acq"
                unit="mm"
                unitTitle="millimetres"
                error={errors.biometrics?.acq}
              />
              <FieldWithUnit
                label="Anterior Chamber Angle nasal (ACAn)"
                name="biometrics.acan"
                unit="º"
                unitTitle="degrees"
                error={errors.biometrics?.acan}
              />
              <FieldWithUnit
                label="Anterior Chamber Angle temporal (ACAt)"
                name="biometrics.acat"
                unit="º"
                unitTitle="degrees"
                error={errors.biometrics?.acat}
              />
              <FieldWithUnit
                label="Keratometry - Flat Meridian (Kf)"
                name="biometrics.kf"
                unit="dpt"
                unitTitle="dioptres"
                error={errors.biometrics?.kf}
              />
              <FieldWithUnit
                label="Central Corneal Thickness (CCT)"
                name="biometrics.cct"
                unit="μm"
                unitTitle="micrometres"
                error={errors.biometrics?.cct}
              />
            </div>
            <div className="col-md-3 offset-md-1">
              <h2>Spectacle Refraction</h2>
              <FieldWithUnit
                label="Sphere"
                name="spectacleRefraction.sphere"
                unit="dpt"
                unitTitle="dioptres"
                error={errors.spectacleRefraction?.sphere}
              />
              <FieldWithUnit
                label="Cylindre"
                name="spectacleRefraction.cylindre"
                unit="dpt"
                unitTitle="dioptres"
                error={errors.spectacleRefraction?.cylindre}
              />
              <FieldWithUnit
                label="Axis"
                name="spectacleRefraction.axis"
                unit="º"
                unitTitle="degrees"
                error={errors.spectacleRefraction?.axis}
              />
              <FieldWithUnit
                label="Vertex"
                name="spectacleRefraction.vertex"
                unit="mm"
                unitTitle="millimetres"
                error={errors.spectacleRefraction?.vertex}
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
                unitTitle="dioptres"
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
                unitTitle="dioptres"
                disabled={true}
              />
              <FieldWithUnit
                label="Axis"
                name="iclAxis"
                value={calcIclAxis(values.spectacleRefraction.axis)}
                unit="º"
                unitTitle="degrees"
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
                unitTitle="degrees"
                disabled={true}
              />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};
