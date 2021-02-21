import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

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


const FieldWithUnit = ({ label, name, unit, placeholder, error }) => {

  return (
    <div className="form-group row">
      <label htmlFor={name + 'field'} className="col-sm-6 col-form-label">{label}</label>
      <div className="col-sm-6">
        <div className="input-group">
          <Field name={name} className={(error ? 'is-invalid' : '') + ' form-control text-right'} placeholder={placeholder} autoComplete="off" />
          {unit
            ? <div className="input-group-append">
                <span className="input-group-text">{unit}</span>
              </div>
            : null
          }
          <ErrorMessage name={name} component="div" className="invalid-feedback text-right" />
        </div>
      </div>
    </div>
  );
};


export const Pinge = ({ initialValues, renderICLPower }) => {
  return (
    <div>
      <h2>Patient</h2>
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
            {false && renderICLPower && renderICLPower({ param1: values.name })}
            <button type="submit" disabled={isSubmitting} style={{display: 'none'}}>
              Submit
            </button>
            <div className="form-row">
              <div className="col-md-4">
                <h2>Biometrics</h2>
                <FieldWithUnit label="Angle to Angle" name="ata" unit="mm" error={errors.ata} />
                <FieldWithUnit label="White to White" name="wtw" unit="mm" unitTitle="millimetres" error={errors.wtw} />
                <FieldWithUnit label="Crystaline Lens Rise" name="clr" unit="nm" unitTitle="nanometres" error={errors.clr} />
                <FieldWithUnit label="Anterior Chamber Depth" name="acp" unit="mm" unitTitle="millimetres" error={errors.acp} />
                <FieldWithUnit label="Anterior Chamber Angle nasal" name="acan" unit="º" unitTitle="degrees" error={errors.acan} />
                <FieldWithUnit label="Anterior Chamber Angle temporal" name="acat" unit="º" unitTitle="degrees" error={errors.acat} />
                <FieldWithUnit label="Keratometry - Flat Meridian" name="kfm" unit="dpt" unitTitle="dioptres" error={errors.kfm} />
                <FieldWithUnit label="Central Corneal Thickness" name="cct" unit="μm" unitTitle="micrometres" error={errors.cct} />
              </div>
              <div className="col-md-3 offset-md-1">
                <h2>Spectacle Refraction</h2>
                <FieldWithUnit label="Sphere" name="sphere" unit="dpt" unitTitle="dioptres" error={errors.sphere} />
                <FieldWithUnit label="Cylinder" name="cylinder" unit="dpt" unitTitle="dioptres" error={errors.cylinder} />
                <FieldWithUnit label="Axis" name="axis" unit="º" unitTitle="degrees" error={errors.axis} />
              </div>
              <div className="col-md-3 offset-md-1">
                <h2>ICL Power</h2>
                <FieldWithUnit label="Sphere" name="iclSphere" unit="dpt" unitTitle="dioptres" error={errors.iclSphere} />
                <FieldWithUnit label="Cylinder" name="iclCylinder" unit="dpt" unitTitle="dioptres" error={errors.iclCylinder} />
                <FieldWithUnit label="Axis" name="iclAxis" unit="º" unitTitle="degrees" error={errors.iclAxis} />
                <FieldWithUnit label="Spherical Equivalent" name="iclSphericalEquivalent" unit="º" unitTitle="degrees" error={errors.iclSphericalEquivalent} />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};
