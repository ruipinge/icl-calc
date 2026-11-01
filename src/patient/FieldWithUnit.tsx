import * as React from 'react';
import { UnitMark, fieldValidity } from './validity';

import { Field } from 'formik';

type Unit = 'mm' | 'nm' | 'º' | 'dpt' | 'μm';

const UNITS: Map<Unit, string> = new Map([
  ['mm', 'millimetres'], // 10^(-3) metres
  ['μm', 'micrometres'], // 10^(-6) metres (aka "micron", or "micra")
  ['nm', 'nanometres'], // 10^(-9) metres
  ['º', 'degrees'],
  ['dpt', 'dioptres']
]);

export interface FieldWithUnitProps {
  label: string;
  name: string;
  unit: Unit;
  srLabel?: string;
  qualifier?: string;
  labelClassName?: string;
  touched?: boolean;
  placeholder?: string;
  error?: string;
  value?: number | '';
  disabled?: boolean;
}

/*
 * One measured field as two grid cells: its label, and its value - the
 * control, its unit and, while it is shown, its message. The value spans the
 * control and unit tracks as a subgrid, so the message sits directly under
 * its own control, and a row holding two fields (a keratometry reading and
 * its axis) keeps both on one line with each message under its own input.
 */
export const measuredCells = ({
  label,
  name,
  unit,
  srLabel,
  qualifier,
  labelClassName,
  placeholder,
  error,
  touched,
  value,
  disabled
}: FieldWithUnitProps): React.ReactNode => {
  const id = name + 'field';
  const { props: validity, message } = fieldValidity(name, error, touched);

  return (
    <>
      <label htmlFor={id} className={labelClassName}>
        {/*
         * The whole name lives in the sr-only span and the visible text is
         * hidden. Chromium pads an absolutely positioned span with spaces
         * when it joins label text, so a name split across the two spans
         * read "(AtA) , millimetres".
         */}
        <span aria-hidden="true">{label}</span>
        <span className="sr-only">
          {srLabel ?? label}
          {qualifier}, {UNITS.get(unit)}
        </span>
      </label>
      <div className="mvalue">
        {disabled ? (
          <input id={id} name={name} value={value} disabled={true} />
        ) : (
          <Field
            type="number"
            id={id}
            name={name}
            placeholder={placeholder}
            autoComplete="off"
            {...validity}
          />
        )}
        <UnitMark>{unit}</UnitMark>
        {message}
      </div>
    </>
  );
};

export const FieldWithUnit: React.FC<FieldWithUnitProps> = (props) => (
  <div className="mrow">{measuredCells(props)}</div>
);
