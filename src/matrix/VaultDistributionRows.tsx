import { MatrixFilter, VaultRange, filterFlatRows } from './data';

import { DataPoint } from '../db';
import { MatrixRow } from './components';
import { round } from '../formulas';

export const countByVaultRange = ({
  points,
  range
}: {
  points: DataPoint[];
  range: VaultRange;
}): number =>
  points.filter((point) => {
    if (range.min !== undefined && range.max !== undefined) {
      return range.min <= point.vault && point.vault < range.max;
    }
    if (range.min !== undefined) {
      return range.min <= point.vault;
    }
    if (range.max !== undefined) {
      return point.vault < range.max;
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
  filterFlatRows(filter).map((points) =>
    points.length !== 0
      ? round(countByVaultRange({ points, range }) / points.length, 3)
      : 0
  );

interface VaultDestributionTexts {
  label: string;
  title: string;
}

const FORMATTERS = {
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
    return FORMATTERS.minMax(range.min, range.max);
  }
  if (range.min !== undefined) {
    return FORMATTERS.min(range.min);
  }
  if (range.max !== undefined) {
    return FORMATTERS.max(range.max);
  }
  return FORMATTERS.empty;
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

interface VaultSizeRange {
  min?: number;
  max?: number;
}
const VAULT_SIZE_RANGES: VaultSizeRange[] = [
  {
    max: 0.25
  },
  {
    min: 0.25,
    max: 0.5
  },
  {
    min: 0.5,
    max: 0.75
  },
  {
    min: 0.75,
    max: 1
  },
  {
    min: 1
  }
];

export const VaultDistributionRows = (filter: MatrixFilter) => (
  <>
    {VAULT_SIZE_RANGES.map((range, index) => (
      <PercentVaultSizeRow filter={filter} range={range} key={index} />
    ))}
  </>
);
