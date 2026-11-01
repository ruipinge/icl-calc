import * as React from 'react';

import { measuredParts, rowMessageFlag } from './FieldWithUnit';

import { UnitMark } from './validity';

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
 * A keratometry reading as a clinician says it, "X dpt at Y º", on one row:
 * label | K | @ | axis | º. The K value's unit is in its label, "KAntFlt
 * (dpt)"; the axis has no label of its own on screen, only the "@", so its
 * unit follows it as a mark. Each control keeps its own name. Its message
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
    unit: 'º',
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
      <UnitMark>º</UnitMark>
      {k.message}
      {axis.message}
    </div>
  );
};
