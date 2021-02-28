import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { FieldWithUnit } from './FieldWithUnit';
import {
  calcIclSphere,
  calcIclCylinder,
  calcIclAxis,
  calcIclCylinderEquivalent
} from './formulas';

const ICLSchema = Yup.object().shape({
  patient: Yup.object().shape({
    name: Yup.string()
      .min(5, 'Too Short!')
      .max(10, 'Too Long!')
      .required('Required')
  }),
  biometrics: Yup.object().shape({
    ata: Yup.number()
      .min(0, 'Too Short!')
      .max(10, 'Too Long!')
      .required('Required')
  }),
  spectacleRefraction: Yup.object().shape({
    axis: Yup.number()
      .min(0, 'Too Short!')
      .max(180, 'Too Long!')
      .required('Required')
  })
});

interface Biometrics {
  ata: number;
  wtw: number;
  clr: number;
  acp: number;
  acan: number;
  acat: number;
  kfm: number;
  cct: number;
}

interface SpectacleRefraction {
  sphere: number;
  cylinder: number;
  axis: number;
}

interface Patient {
  name: string;
  age: number;
  dateOfBirth: string;
  eye: 'left' | 'right';
}

export interface ICLForm {
  patient: Patient;
  biometrics: Biometrics;
  spectacleRefraction: SpectacleRefraction;
}

interface ContainerProps {
  initialValues: ICLForm;
  setStatus: (arg1: boolean) => void;
}

export const PingeForm: React.FC<ContainerProps> = ({
  initialValues,
  setStatus
}) => {
  return (
    <div>
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
        {({ isSubmitting, errors, touched, values }) => (
          <Form>
            <h2>Patient</h2>
            <div className="form-row">
              <div className="form-group col-md-4">
                <label htmlFor="fieldName">Name</label>
                <Field
                  name="patient.name"
                  className="form-control"
                  id="fieldName"
                  automcomplete="off"
                />
              </div>
              <div className="form-group col-md-2 offset-md-1">
                <label htmlFor="fieldDateOfBirth">Date of Birth</label>
                <Field
                  name="patient.dateOfBirth"
                  className="form-control"
                  id="fieldDateOfBirth"
                  placeholder="yyyy-mm-dd"
                  automcomplete="off"
                />
              </div>
              <div className="form-group col-md-1 offset-md-1">
                <label htmlFor="fieldAge">Age</label>
                <Field
                  name="patient.age"
                  className="form-control"
                  id="fieldAge"
                  automcomplete="off"
                />
              </div>
              <div className="form-group col-md-2 offset-md-1">
                <label htmlFor="fieldEye">Eye</label>
                <Field
                  as="select"
                  name="eye"
                  className="form-control"
                  id="fieldEye"
                  automcomplete="off"
                >
                  <option value="">Select...</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </Field>
              </div>
            </div>
            {errors.patient?.name && touched.patient?.name ? (
              <div>{errors.patient.name}</div>
            ) : null}
            <ErrorMessage name="name" component="div" />
            <hr />
            {false && setStatus && setStatus(true)}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ display: 'none' }}
            >
              Submit
            </button>
            <div className="form-row">
              <div className="col-md-4">
                <h2>Biometrics</h2>
                <FieldWithUnit
                  label="Angle to Angle"
                  name="biometrics.ata"
                  unit={'mm'}
                  error={errors.biometrics?.ata}
                />
                <FieldWithUnit
                  label="White to White"
                  name="biometrics.wtw"
                  unit={'mm'}
                  unitTitle={'millimetres'}
                  error={errors.biometrics?.wtw}
                />
                <FieldWithUnit
                  label="Crystaline Lens Rise"
                  name="biometrics.clr"
                  unit={'nm'}
                  unitTitle={'nanometres'}
                  error={errors.biometrics?.clr}
                />
                <FieldWithUnit
                  label="Anterior Chamber Depth"
                  name="biometrics.acp"
                  unit={'mm'}
                  unitTitle={'millimetres'}
                  error={errors.biometrics?.acp}
                />
                <FieldWithUnit
                  label="Anterior Chamber Angle nasal"
                  name="abiometrics.can"
                  unit={'º'}
                  unitTitle={'degrees'}
                  error={errors.biometrics?.acan}
                />
                <FieldWithUnit
                  label="Anterior Chamber Angle temporal"
                  name="abiometrics.cat"
                  unit={'º'}
                  unitTitle={'degrees'}
                  error={errors.biometrics?.acat}
                />
                <FieldWithUnit
                  label="Keratometry - Flat Meridian"
                  name="biometrics.kfm"
                  unit={'dpt'}
                  unitTitle={'dioptres'}
                  error={errors.biometrics?.kfm}
                />
                <FieldWithUnit
                  label="Central Corneal Thickness"
                  name="biometrics.cct"
                  unit={'μm'}
                  unitTitle={'micrometres'}
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
                  label="Cylinder"
                  name="spectacleRefraction.cylinder"
                  unit="dpt"
                  unitTitle="dioptres"
                  error={errors.spectacleRefraction?.cylinder}
                />
                <FieldWithUnit
                  label="Axis"
                  name="spectacleRefraction.axis"
                  unit="º"
                  unitTitle="degrees"
                  error={errors.spectacleRefraction?.axis}
                />
              </div>
              <div className="col-md-3 offset-md-1">
                <h2>ICL Power</h2>
                <p>{calcIclAxis(values.spectacleRefraction.axis)}</p>
                <FieldWithUnit
                  label="Sphere"
                  name="iclSphere"
                  value={calcIclSphere(
                    values.spectacleRefraction.sphere,
                    values.spectacleRefraction.cylinder
                  )}
                  unit="dpt"
                  unitTitle="dioptres"
                  disabled={true}
                />
                <FieldWithUnit
                  label="Cylinder"
                  name="iclCylinder"
                  value={calcIclCylinder(
                    values.spectacleRefraction.sphere,
                    values.spectacleRefraction.cylinder
                  )}
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
                  value={calcIclCylinderEquivalent(
                    values.spectacleRefraction.sphere,
                    values.spectacleRefraction.cylinder
                  )}
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
    </div>
  );
};
