import { Field, FormikState } from 'formik';

import { ICLFormValues } from '../types';
import { fieldValidity } from './validity';
import { knownAge } from '../missing';

export const Info = ({
  errors,
  values,
  touched
}: FormikState<Pick<ICLFormValues, 'patient'>>) => {
  const { props: dobValidity, message: dobMessage } = fieldValidity(
    'patient.dateOfBirth',
    errors.patient?.dateOfBirth,
    touched.patient?.dateOfBirth
  );

  return (
    <section className="fieldgroup-section">
      <h4>Information</h4>
      <div className="idgroup">
        <div className="idcell">
          <label htmlFor="fieldName">Name</label>
          <Field
            name="patient.name"
            id="fieldName"
            placeholder="enter patient name"
            autoComplete="off"
          />
        </div>
        <div className="idcell">
          <label htmlFor="fieldDateOfBirth">Date of Birth</label>
          <Field
            name="patient.dateOfBirth"
            id="fieldDateOfBirth"
            placeholder="yyyy-mm-dd"
            autoComplete="off"
            maxLength={10}
            {...dobValidity}
          />
          {dobMessage}
        </div>
        <div className="idcell">
          {/* the label carries the unit, as every measured field's does */}
          <label htmlFor="fieldAge">Age (years)</label>
          <input
            name="age"
            id="fieldAge"
            disabled={true}
            value={knownAge(values.patient) ?? ''}
          />
        </div>
        <div className="idcell">
          <label htmlFor="fieldEye">Eye</label>
          <Field as="select" name="patient.eye" id="fieldEye">
            <option value="">Select...</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </Field>
        </div>
      </div>
    </section>
  );
};
