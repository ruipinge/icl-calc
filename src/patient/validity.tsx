import * as React from 'react';

/*
 * The wiring every patient field shares: an error is shown, and announced,
 * only once the field has been touched. The `${name}-error` id convention and
 * that trigger condition live here so the measured row and the identity row
 * cannot drift apart.
 */
export const fieldValidity = (
  name: string,
  error?: string,
  touched?: boolean
): { props: Record<string, string | boolean>; message: React.ReactNode } => {
  if (!(error && touched)) {
    return { props: {}, message: null };
  }
  const errorId = `${name}-error`;

  return {
    props: { 'aria-invalid': true, 'aria-describedby': errorId },
    message: (
      <div id={errorId} className="mrow-error">
        {error}
      </div>
    )
  };
};

/* The unit as a sighted clinician reads it; the full word is in the name. */
export const UnitMark: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <span className="unit" aria-hidden="true">
    {children}
  </span>
);
