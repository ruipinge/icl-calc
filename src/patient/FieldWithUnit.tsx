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

interface FieldWithUnitProps {
  label: string;
  name: string;
  unit: Unit;
  srLabel?: string;
  qualifier?: string;
  axisOf?: boolean;
  touched?: boolean;
  placeholder?: string;
  error?: string;
  value?: number;
  disabled?: boolean;
}

export const FieldWithUnit: React.FC<FieldWithUnitProps> = ({
  label,
  name,
  unit,
  srLabel,
  qualifier,
  axisOf,
  placeholder,
  error,
  touched,
  value,
  disabled
}) => {
  const id = name + 'field';
  const { props: validity, message } = fieldValidity(name, error, touched);

  return (
    <div className={axisOf ? 'mrow axis' : 'mrow'}>
      <label htmlFor={id}>
        {/*
         * The whole name lives in the sr-only span and the visible text is
         * hidden. Chromium pads an absolutely positioned span with spaces when
         * it joins label text, so a name split across the two spans read
         * "(AtA) , millimetres".
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
      {message}
    </div>
  );
};
