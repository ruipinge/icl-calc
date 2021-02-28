import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { FieldWithUnit } from './FieldWithUnit'
import { calcIclSphere, calcIclCylinder, calcIclAxis, calcIclCylinderEquivalent } from './formulas'


const ICLSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, "Too Short!")
    .max(10, "Too Long!")
    .required("Required"),
  ata: Yup.number()
    .min(0, "Too Short!")
    .max(10, "Too Long!")
    .required("Required"),
});


export interface FormValues {
  name: string;
  age: number;
  dateOfBirth: string;
  eye: 'left' | 'right';

  // Biometrics
  ata: number;
  wtw: number;
  clr: number;
  acp: number;
  acan: number;
  acat: number;
  kfm: number;
  cct: number;

  // Spectacle Refraction
  sphere: number;
  cylinder: number;
  axis: number;
};


interface ContainerProps {
  initialValues: FormValues;
  setStatus: (arg1: boolean) => void;
}



export const PingeForm: React.FC<ContainerProps> = ({ initialValues, setStatus }) => {
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
                <Field name="name" className="form-control" id="fieldName" automcomplete="off" />
              </div>
              <div className="form-group col-md-2 offset-md-1">
                <label htmlFor="fieldDateOfBirth">Date of Birth</label>
                <Field name="dateOfBirth" className="form-control" id="fieldDateOfBirth" placeholder="yyyy-mm-dd" automcomplete="off" />
              </div>
              <div className="form-group col-md-1 offset-md-1">
                <label htmlFor="fieldAge">Age</label>
                <Field name="age" className="form-control" id="fieldAge" automcomplete="off" />
              </div>
              <div className="form-group col-md-2 offset-md-1">
                <label htmlFor="fieldEye">Eye</label>
                <Field as="select" name="eye" className="form-control" id="fieldEye" automcomplete="off">
                  <option value="">Select...</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </Field>
              </div>
            </div>
            {errors.name && touched.name ? <div>{errors.name}</div> : null}
            <ErrorMessage name="name" component="div" />
            <hr />
            {false && setStatus && setStatus(true)}
            <button type="submit" disabled={isSubmitting} style={{display: 'none'}}>
              Submit
            </button>
            <div className="form-row">
              <div className="col-md-4">
                <h2>Biometrics</h2>
                <FieldWithUnit label="Angle to Angle" name={'ata'} unit={'mm'} error={errors.ata} />
                <FieldWithUnit label="White to White" name={'wtw'} unit={'mm'} unitTitle={'millimetres'} error={errors.wtw} />
                <FieldWithUnit label="Crystaline Lens Rise" name={'clr'} unit={'nm'} unitTitle={'nanometres'} error={errors.clr} />
                <FieldWithUnit label="Anterior Chamber Depth" name={'acp'} unit={'mm'} unitTitle={'millimetres'} error={errors.acp} />
                <FieldWithUnit label="Anterior Chamber Angle nasal" name={'acan'} unit={'º'} unitTitle={'degrees'} error={errors.acan} />
                <FieldWithUnit label="Anterior Chamber Angle temporal" name={'acat'} unit={'º'} unitTitle={'degrees'} error={errors.acat} />
                <FieldWithUnit label="Keratometry - Flat Meridian" name={'kfm'} unit={'dpt'} unitTitle={'dioptres'} error={errors.kfm} />
                <FieldWithUnit label="Central Corneal Thickness" name={'cct'} unit={'μm'} unitTitle={'micrometres'} error={errors.cct} />
              </div>
              <div className="col-md-3 offset-md-1">
                <h2>Spectacle Refraction</h2>
                <FieldWithUnit label="Sphere" name="sphere" unit="dpt" unitTitle="dioptres" error={errors.sphere} />
                <FieldWithUnit label="Cylinder" name="cylinder" unit="dpt" unitTitle="dioptres" error={errors.cylinder} />
                <FieldWithUnit label="Axis" name="axis" unit="º" unitTitle="degrees" error={errors.axis} />
              </div>
              <div className="col-md-3 offset-md-1">
                <h2>ICL Power</h2>
                <FieldWithUnit label="Sphere" name="iclSphere" value={calcIclSphere(values.sphere, values.cylinder)} unit="dpt" unitTitle="dioptres" disabled={true} />
                <FieldWithUnit label="Cylinder" name="iclCylinder" value={calcIclCylinder(values.sphere, values.cylinder)} unit="dpt" unitTitle="dioptres" disabled={true} />
                <FieldWithUnit label="Axis" name="iclAxis" value={calcIclAxis(values.axis)} unit="º" unitTitle="degrees" disabled={true} />
                <FieldWithUnit label="Spherical Equivalent" value={calcIclCylinderEquivalent(values.sphere, values.cylinder)} name="iclSphericalEquivalent" unit="º" unitTitle="degrees" disabled={true} />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
