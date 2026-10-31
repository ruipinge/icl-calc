import * as React from 'react';

import { measuredCells } from './FieldWithUnit';

interface KeratometryRowProps {
  label: string;
  name: string;
  axisSrLabel: string;
  axisName: string;
  error?: string;
  touched?: boolean;
  axisError?: string;
  axisTouched?: boolean;
}

/*
 * A keratometry reading as a clinician says it, "X dpt at Y º", on one row:
 * label | K dpt | @ | axis º. Each control keeps its own label and name, and
 * its message sits under it, inside its own value cell, so a message under
 * the axis can never be read as one about the K value.
 */
export const KeratometryRow: React.FC<KeratometryRowProps> = ({
  label,
  name,
  axisSrLabel,
  axisName,
  error,
  touched,
  axisError,
  axisTouched
}) => {
  const k = measuredCells({ label, name, unit: 'dpt', error, touched });
  const axis = measuredCells({
    label: '@',
    srLabel: axisSrLabel,
    labelClassName: 'kat',
    name: axisName,
    unit: 'º',
    error: axisError,
    touched: axisTouched
  });

  return (
    <div className="mrow krow">
      {k}
      {axis}
    </div>
  );
};
