import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, "Too Short!")
    .max(10, "Too Long!")
    .required("Required"),
  password: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

export const Pinge = ({ initialValues, renderICLPower }) => {
  return (
    <div>
      <h2>Patient</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={SignupSchema}
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
            {renderICLPower && renderICLPower({ param1: values.name })}
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
