import { Biometry } from './Biometry';
import { CorneaProfile } from './CorneaProfile';
import { FormikState } from 'formik';
import { ICLInputs } from '../types';
import { ICLPower } from './ICLPower';
import { Info } from './Info';
import { SpectacleRefraction } from './SpectacleRefraction';

export const Patient = ({
  errors,
  touched,
  values,
  ...otherProps
}: FormikState<ICLInputs>) => (
  <>
    <Info values={values} errors={errors} touched={touched} {...otherProps} />
    <hr />
    <div className="form-row">
      <div className="col-md-3">
        <Biometry
          values={values}
          errors={errors}
          touched={touched}
          {...otherProps}
        />
      </div>
      <div className="col-md-4 offset-md-1">
        <CorneaProfile
          values={values}
          errors={errors}
          touched={touched}
          {...otherProps}
        />
      </div>
      <div className="col-md-3 offset-md-1">
        <SpectacleRefraction
          values={values}
          errors={errors}
          touched={touched}
          {...otherProps}
        />
        <ICLPower
          values={values}
          errors={errors}
          touched={touched}
          {...otherProps}
        />
      </div>
    </div>
  </>
);
