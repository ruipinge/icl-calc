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
  value?: number;
  disabled?: boolean;
}

/*
 * One measured field as grid cells - label, control, unit - and its message
 * kept apart, so a row holding two fields (a keratometry reading and its
 * axis) can lay out all six cells on one line before either message.
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
}: FieldWithUnitProps): {
  cells: React.ReactNode;
  message: React.ReactNode;
} => {
  const id = name + 'field';
  const { props: validity, message } = fieldValidity(name, error, touched);

  return {
    cells: (
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
      </>
    ),
    message
  };
};

export const FieldWithUnit: React.FC<FieldWithUnitProps> = (props) => {
  const { cells, message } = measuredCells(props);

  return (
    <div className="mrow">
      {cells}
      {message}
    </div>
  );
};
