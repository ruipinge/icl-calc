import { Field, FormikState } from 'formik';

import { ICLInputs } from '../types';

export const Info = ({
  errors,
  values,
  touched
}: FormikState<Pick<ICLInputs, 'patient'>>) => {
  const dobError = errors.patient?.dateOfBirth;
  const showDobError = Boolean(dobError && touched.patient?.dateOfBirth);

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
            {...(showDobError && {
              'aria-invalid': true,
              'aria-describedby': 'patient.dateOfBirth-error'
            })}
          />
          {showDobError && (
            <div id="patient.dateOfBirth-error" className="mrow-error">
              {dobError}
            </div>
          )}
        </div>
        <div className="idcell">
          <label htmlFor="fieldAge">
            Age<span className="sr-only">, years</span>
          </label>
          <div className="idvalue">
            <input
              name="age"
              id="fieldAge"
              disabled={true}
              value={values.patient.age()}
            />
            <span className="unit" aria-hidden="true">
              years
            </span>
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
