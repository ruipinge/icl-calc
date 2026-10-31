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
 * label | K | dpt | at | axis | º. Each control keeps its own label, name and
 * message; the messages follow all six cells so neither one splits the line.
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
    label: 'at',
    srLabel: axisSrLabel,
    labelClassName: 'kat',
    name: axisName,
    unit: 'º',
    error: axisError,
    touched: axisTouched
  });

  return (
    <div className="mrow krow">
      {k.cells}
      {axis.cells}
      {k.message}
      {axis.message}
    </div>
  );
};
