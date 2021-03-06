import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { differenceInYears } from 'date-fns';

import { FieldWithUnit } from './components/FieldWithUnit';
import { ICLSchema } from './ICLSchema';
import {
  calcIclSphere,
  calcIclCylindre,
  calcIclAxis,
  calcIclCylindreEquivalent
} from './formulas';

interface Patient {
  name: string;
  dateOfBirth: string;
  eye: 'left' | 'right';
}

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
  patient: Patient;
  biometrics: Biometrics;
  spectacleRefraction: SpectacleRefraction;
}

interface ContainerProps {
  initialValues: ICLInputs;
  setStatus: (arg1: boolean) => void;
}

export const ICLForm: React.FC<ContainerProps> = ({
  initialValues,
  setStatus
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ICLSchema}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }, 400);
      }}
    >
      {({ errors, touched, values }) => (
        <Form>
          <h2>Patient</h2>
          <div className="form-row">
            <div className="form-group col-md-4">
              <label htmlFor="fieldName">Name</label>
              <Field
                name="patient.name"
                className="form-control"
                id="fieldName"
                placeholder="enter patient name"
                autoComplete="off"
              />
            </div>
            <div className="form-group col-md-2 offset-md-1">
              <label htmlFor="fieldDateOfBirth">Date of Birth</label>
              <Field
                name="patient.dateOfBirth"
                className={
                  (errors.patient?.dateOfBirth && touched.patient?.dateOfBirth
                    ? 'is-invalid'
                    : '') + ' form-control'
                }
                id="fieldDateOfBirth"
                placeholder="yyyy-mm-dd"
                autoComplete="off"
                maxLength={10}
              />
              <ErrorMessage
                name="patient.dateOfBirth"
                component="div"
                className="invalid-feedback"
              />
            </div>
            <div className="form-group col-md-1 offset-md-1">
              <label htmlFor="fieldAge">Age</label>
              <div className="input-group">
                <input
                  name="patient.age"
                  className="form-control text-right"
                  id="fieldAge"
                  disabled={true}
                  value={
                    values.patient.dateOfBirth && !errors.patient?.dateOfBirth
                      ? differenceInYears(
                          new Date(),
                          new Date(values.patient.dateOfBirth)
                        ) || ''
                      : ''
                  }
                />
                <div className="input-group-append">
                  <span className="input-group-text" title="years">
                    yr.
                  </span>
                </div>
              </div>
            </div>
            <div className="form-group col-md-2 offset-md-1">
              <label htmlFor="fieldEye">Eye</label>
              <Field
                as="select"
                name="eye"
                className="form-control"
                id="fieldEye"
                autoComplete="off"
              >
                <option value="">Select...</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </Field>
            </div>
          </div>
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
