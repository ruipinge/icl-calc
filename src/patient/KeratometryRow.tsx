import * as React from 'react';

import { measuredParts, rowMessageFlag } from './FieldWithUnit';

interface KeratometryRowProps {
  label: string;
  caption: string;
  name: string;
  axisSrLabel: string;
  axisName: string;
  error?: string;
  touched?: boolean;
  axisError?: string;
  axisTouched?: boolean;
}

/*
 * A keratometry reading as a clinician says it, "X dpt at Y °", on one row:
 * label | K | @ | axis. The label carries both units in the order the
 * controls follow it, "KAntFlt (dpt @ °)", so neither input has a mark
 * beside it. Each control keeps its own name. Its message
 * follows the row's cells on a line of its own, across the whole row, and
 * opens with which control it is about - "K: " or "Axis: " - so a message
 * about the axis can never be read as one about the K value.
 */
export const KeratometryRow: React.FC<KeratometryRowProps> = ({
  label,
  caption,
  name,
  axisSrLabel,
  axisName,
  error,
  touched,
  axisError,
  axisTouched
}) => {
  const k = measuredParts({
    label,
    caption,
    shownUnits: 'dpt @ °',
    name,
    unit: 'dpt',
    error,
    touched,
    messagePrefix: 'K: '
  });
  const axis = measuredParts({
    label: '@',
    srLabel: axisSrLabel,
    labelClassName: 'kat',
    name: axisName,
    unit: '°',
    error: axisError,
    touched: axisTouched,
    messagePrefix: 'Axis: '
  });

  return (
    <div
      className="mrow krow"
      data-message={rowMessageFlag([k.message, axis.message])}
    >
      {k.label}
      {k.control}
      {axis.label}
      {axis.control}
      {k.message}
      {axis.message}
    </div>
  );
};
