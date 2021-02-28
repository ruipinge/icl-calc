import * as React from 'react';

import { Field, ErrorMessage } from "formik";

interface FieldWithUnitProps {
  label: string;
  name: string;
  unit?: string;
  unitTitle?: string;
  placeholder?: string;
  error?: any;
  value?: number;
  disabled?: boolean;
}


export const FieldWithUnit: React.FC<FieldWithUnitProps> = ({
  label,
  name,
  unit,
  unitTitle,
  placeholder,
  error,
  value,
  disabled}) => {

  return (
    <div className={'form-group row'}>
      <label htmlFor={name + 'field'} className="col-sm-6 col-form-label">{label}</label>
      <div className="col-sm-6">
        <div className="input-group">
          { disabled ?
            <input name={name} value={value} className={'form-control text-right'} disabled={true} />
            :
            <Field name={name} className={(error ? 'is-invalid' : '') + ' form-control text-right'} placeholder={placeholder} autoComplete="off" />
          }
          {unit
            ? <div className="input-group-append">
                <span className="input-group-text" title="{unitTitle}">{unit}</span>
              </div>
            : null
          }
          <ErrorMessage name={name} component="div" className="invalid-feedback text-right" />
        </div>
      </div>
    </div>
  );
};
