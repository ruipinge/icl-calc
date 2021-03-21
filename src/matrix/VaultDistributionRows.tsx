import { MatrixFilter, VaultRange, filterFlatRows } from './data';

import { MatrixRow } from './components';
import { Row } from '../db';
import { round } from '../formulas';

export const countByVaultRange = ({
  rows,
  range
}: {
  rows: Row[];
  range: VaultRange;
}): number =>
  rows.filter((row) => {
    if (range.min !== undefined && range.max !== undefined) {
      return range.min <= row[11] && row[11] < range.max;
    }
    if (range.min !== undefined) {
      return range.min <= row[11];
    }
    if (range.max !== undefined) {
      return row[11] < range.max;
    }
    return false;
  }).length;

export const getVaultDistribution = ({
  filter,
  range
}: {
  filter: MatrixFilter;
  range: VaultRange;
}): number[] =>
  filterFlatRows(filter).map((rows) =>
    rows.length !== 0
      ? round(countByVaultRange({ rows, range }) / rows.length, 3)
      : 0
  );

interface VaultDestributionTexts {
  label: string;
  title: string;
}

const formatters = {
  minMax: (min: number, max: number) => ({
    title: `Percentage of Eyes with Vault size between ${min} mm and ${max} mm`,
    label: `% ${min} < Vault < ${max}`
  }),
  min: (min: number) => ({
    title: `Percentage of Eyes with Vault size greater or equal than ${min} mm`,
    label: `% ${min} < Vault`
  }),
  max: (max: number) => ({
    title: `Percentage of Eyes with Vault size less than ${max} mm`,
    label: `% Vault < ${max}`
  }),
  empty: {
    label: '',
    title: ''
  }
};

export const formatVaultSizeTexts = (
  range: VaultRange
): VaultDestributionTexts => {
  if (range.min !== undefined && range.max !== undefined) {
    return formatters.minMax(range.min, range.max);
  }
  if (range.min !== undefined) {
    return formatters.min(range.min);
  }
  if (range.max !== undefined) {
    return formatters.max(range.max);
  }
  return formatters.empty;
};

const PercentVaultSizeRow = ({
  filter,
  range
}: {
  filter: MatrixFilter;
  range: VaultRange;
}) => {
  const a = formatVaultSizeTexts(range);
  return (
    <MatrixRow
      label={a.label}
      title={a.title}
      values={getVaultDistribution({ range, filter })}
    />
  );
};

export const VaultDistributionRows = (filter: MatrixFilter) => (
  <>
    <PercentVaultSizeRow filter={filter} range={{ max: 0.25 }} />
    <PercentVaultSizeRow filter={filter} range={{ min: 0.25, max: 0.5 }} />
    <PercentVaultSizeRow filter={filter} range={{ min: 0.5, max: 0.75 }} />
    <PercentVaultSizeRow filter={filter} range={{ min: 0.75, max: 1 }} />
    <PercentVaultSizeRow filter={filter} range={{ min: 1 }} />
  </>
);
