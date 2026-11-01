import { Field, FormikState } from 'formik';
import { UnitMark, fieldValidity } from './validity';

import { ICLFormValues } from '../types';
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
          <label htmlFor="fieldAge">
            <span aria-hidden="true">Age</span>
            <span className="sr-only">Age, years</span>
          </label>
          <div className="idvalue">
            <input
              name="age"
              id="fieldAge"
              disabled={true}
              value={knownAge(values.patient) ?? ''}
            />
            <UnitMark>years</UnitMark>
          </div>
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
