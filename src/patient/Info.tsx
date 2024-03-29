import { ErrorMessage, Field, FormikState } from 'formik';

import { ICLInputs } from '../types';
import { getClassName } from '../util';

export const Info = ({
  errors,
  values,
  touched
}: FormikState<Pick<ICLInputs, 'patient'>>) => (
  <>
    <h4>Information</h4>
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
          className={getClassName({
            error: errors.patient?.dateOfBirth,
            touched: touched.patient?.dateOfBirth
          })}
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
      <div className="form-group col-md-2">
        <label htmlFor="fieldAge">Age</label>
        <div className="input-group">
          <input
            name="age"
            className="form-control text-right"
            id="fieldAge"
            disabled={true}
            value={values.patient.age()}
          />
          <div className="input-group-append">
            <span className="input-group-text" title="years">
              years
            </span>
          </div>
        </div>
      </div>
      <div className="form-group col-md-2 offset-md-1">
        <label htmlFor="fieldEye">Eye</label>
        <Field
          as="select"
          name="patient.eye"
          className="form-control"
          id="fieldEye"
        >
          <option value="">Select...</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Field>
      </div>
    </div>
  </>
);
