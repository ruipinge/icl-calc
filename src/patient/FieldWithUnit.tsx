import * as React from 'react';

import { Field } from 'formik';
import { fieldValidity } from './validity';

type Unit = 'mm' | 'nm' | 'º' | 'dpt' | 'μm';

const UNITS: Map<Unit, string> = new Map([
  ['mm', 'millimetres'], // 10^(-3) metres
  ['μm', 'micrometres'], // 10^(-6) metres (aka "micron", or "micra")
  ['nm', 'nanometres'], // 10^(-9) metres
  ['º', 'degrees'],
  ['dpt', 'dioptres']
]);

export interface FieldWithUnitProps {
  /* the short name, shown with its unit in brackets: "AtA" reads "AtA (mm)" */
  label: string;
  name: string;
  unit: Unit;
  /* the full name, shown as a line of its own under the label */
  caption?: string;
  /*
   * the units shown in the brackets when the label speaks for more than its
   * own control: a keratometry row reads "KAntFlt (dpt @ º)", K and axis
   */
  shownUnits?: string;
  /* names the control in place of the label, which is then shown as given */
  srLabel?: string;
  qualifier?: string;
  labelClassName?: string;
  touched?: boolean;
  placeholder?: string;
  error?: string;
  value?: number | '';
  disabled?: boolean;
  /* shown, and read in the page, before the message but outside its
     description: "K: ", "Axis: " */
  messagePrefix?: string;
}

/*
 * One measured field in parts: its label, its control and, while shown, its
 * message. The label is the short name with its unit in brackets - "KAntFlt
 * (dpt)" - over a caption that spells the name out, so the unit is read where
 * the name is and the full name never needs a hover (#192).
 *
 * The accessible name holds the visible label word for word, so speech input
 * can address the field by what is on screen (WCAG 2.5.3), then the caption,
 * the qualifier and the unit spelled out: "AtA (mm), Angle to Angle,
 * millimetres".
 */
export const measuredParts = ({
  label,
  name,
  unit,
  caption,
  shownUnits,
  srLabel,
  qualifier,
  labelClassName,
  placeholder,
  error,
  touched,
  value,
  disabled,
  messagePrefix
}: FieldWithUnitProps) => {
  const id = name + 'field';
  const { props: validity, message } = fieldValidity(
    name,
    error,
    touched,
    messagePrefix
  );
  const shown = srLabel ? label : `${label} (${shownUnits ?? unit})`;
  const accessibleName = [
    srLabel ?? shown,
    caption && ', ' + caption,
    qualifier,
    ', ' + UNITS.get(unit)
  ].join('');

  const labelCell = (
    <label htmlFor={id} className={labelClassName}>
      {/*
       * The whole name lives in the sr-only span and the visible text is
       * hidden. Chromium pads an absolutely positioned span with spaces
       * when it joins label text, so a name split across the two spans
       * read "(AtA) , millimetres".
       */}
      <span aria-hidden="true">{shown}</span>
      {caption && (
        <span className="mcaption" aria-hidden="true">
          {caption}
        </span>
      )}
      <span className="sr-only">{accessibleName}</span>
    </label>
  );

  const control = disabled ? (
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
  );

  return { label: labelCell, control, message };
};

/*
 * The row holds a message, while one shows, as a line of its own across the
 * whole row. data-message tells the stylesheet so; it is set here, not found
 * by :has(), so a test can read it.
 */
export const rowMessageFlag = (messages: React.ReactNode[]) =>
  messages.some(Boolean) ? '' : undefined;

/* label | control, then the message on its own line across the row */
export const FieldWithUnit: React.FC<FieldWithUnitProps> = (props) => {
  const { label, control, message } = measuredParts(props);

  return (
    <div className="mrow" data-message={rowMessageFlag([message])}>
      {label}
      {control}
      {message}
    </div>
  );
};
