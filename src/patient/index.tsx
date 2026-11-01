import { Biometry } from './Biometry';
import { CorneaProfile } from './CorneaProfile';
import { FormikState } from 'formik';
import { ICLFormValues } from '../types';
import { ICLPower } from './ICLPower';
import { Info } from './Info';
import { Presets } from './Presets';
import { SpectacleRefraction } from './SpectacleRefraction';

export const Patient = ({
  errors,
  touched,
  values,
  ...otherProps
}: FormikState<ICLFormValues>) => (
  <>
    <Presets />
    <Info values={values} errors={errors} touched={touched} {...otherProps} />
    <hr />
    <div className="patient-grid">
      <Biometry
        values={values}
        errors={errors}
        touched={touched}
        {...otherProps}
      />
      <CorneaProfile
        values={values}
        errors={errors}
        touched={touched}
        {...otherProps}
      />
      <div>
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
