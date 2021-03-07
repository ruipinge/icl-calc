import * as React from 'react';

import { Field, ErrorMessage } from 'formik';
import { getClassName } from '../util';

type Unit = 'mm' | 'nm' | 'º' | 'dpt' | 'μm';

const UNITS: Map<Unit, string> = new Map([
  ['mm', 'millimetres'],
  ['nm', 'nanometres'],
  ['º', 'degrees'],
  ['dpt', 'dioptres'],
  ['μm', 'micrometres']
]);

interface FieldWithUnitProps {
  label: string;
  name: string;
  unit: Unit;
  touched?: boolean;
  placeholder?: string;
  error?: string;
  value?: number;
  disabled?: boolean;
}

const UnitSufix = ({ unit }: { unit: Unit }) => (
  <div className="input-group-append">
    <span className="input-group-text" title={UNITS.get(unit)}>
      {unit}
    </span>
  </div>
);

export const FieldWithUnit: React.FC<FieldWithUnitProps> = ({
  label,
  name,
  unit,
  placeholder,
  error,
  touched,
  value,
  disabled
}) => {
  return (
    <div className={'form-group row'}>
      <label htmlFor={name + 'field'} className="col-sm-6 col-form-label">
        {label}
      </label>
      <div className="col-sm-6">
        <div className="input-group">
          {disabled ? (
            <input
              name={name}
              value={value}
              className="form-control text-right"
              disabled={true}
            />
          ) : (
            <Field
              type="number"
              name={name}
              className={getClassName({
                error: error,
                touched: touched,
                base: ['form-control', 'text-right']
              })}
              placeholder={placeholder}
              autoComplete="off"
            />
          )}
          <UnitSufix unit={unit} />
          <ErrorMessage
            name={name}
            component="div"
            className="invalid-feedback"
          />
        </div>
      </div>
    </div>
  );
};
