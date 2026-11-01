import * as React from 'react';

/*
 * A message is wrapped to the width of its row, which at 360px is a few
 * words. A range must not break inside its brackets - "[0," over
 * "180]" - so each one is kept whole on one line.
 */
const keepRangesWhole = (text: string): React.ReactNode[] =>
  text.split(/(\[[^\]]{0,40}\])/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="mrow-range">
        {part}
      </span>
    ) : (
      part
    )
  );

/*
 * The wiring every patient field shares: an error is shown, and announced,
 * only once the field has been touched. The `${name}-error` id convention and
 * that trigger condition live here so the measured row and the identity row
 * cannot drift apart.
 *
 * A prefix names which of a row's controls the message is about ("K: ",
 * "Axis: ") for a sighted reader. It sits outside the element the control's
 * aria-describedby points at, and is hidden, so the description announced is
 * the message alone: the control's own name already says which field it is.
 */
export const fieldValidity = (
  name: string,
  error?: string,
  touched?: boolean,
  prefix?: string
): { props: Record<string, string | boolean>; message: React.ReactNode } => {
  if (!(error && touched)) {
    return { props: {}, message: null };
  }
  const errorId = `${name}-error`;

  return {
    props: { 'aria-invalid': true, 'aria-describedby': errorId },
    message: (
      <div className="mrow-error">
        {prefix && <span className="mrow-error-field">{prefix}</span>}
        <span id={errorId}>{keepRangesWhole(error)}</span>
      </div>
    )
  };
};

/*
 * A unit as a sighted clinician reads it, after a control whose label does
 * not carry it - a keratometry axis, labelled only "@". The full word is in
 * the control's name.
 */
export const UnitMark: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <span className="unit" aria-hidden="true">
    {children}
  </span>
);
