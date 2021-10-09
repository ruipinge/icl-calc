import { MatrixFilter, filterFlatRows } from './data';

import { DataPoint } from '../db';
import { MatrixRow } from './components';
import { round } from '../formulas';

export const getVaultVals = ({
  filter,
  reducer
}: {
  filter: MatrixFilter;
  reducer: (points: DataPoint[]) => number;
}): number[] =>
  filterFlatRows(filter).map((points: DataPoint[]) =>
    round(reducer(points), 5)
  );

export const getVaultAverages = (filter: MatrixFilter): number[] =>
  getVaultVals({
    filter,
    reducer: (points: DataPoint[]) =>
      Math.round(
        points.reduce((memo, point) => memo + point.vault, 0) / points.length
      ) || 0
  });

type lessGreater = (a: number, b: number) => boolean;
const lessThan: lessGreater = (a: number, b: number) => a < b;
const greaterThan: lessGreater = (a: number, b: number) => a > b;

export const getVaultMaxMin = ({
  filter,
  comparator
}: {
  filter: MatrixFilter;
  comparator: lessGreater;
}): number[] =>
  getVaultVals({
    filter,
    reducer: (points: DataPoint[]) =>
      points.reduce(
        (memo, point) =>
          memo === 0 || comparator(memo, point.vault) ? point.vault : memo,
        0
      )
  });

export const getVaultMaxs = (filter: MatrixFilter): number[] =>
  getVaultMaxMin({ filter, comparator: lessThan });

export const getVaultMins = (filter: MatrixFilter): number[] =>
  getVaultMaxMin({ filter, comparator: greaterThan });

const VaultSizeRow = ({
  label,
  values
}: {
  label: string;
  values: number[];
}) => (
  <MatrixRow
    label={`${label} Vault (μm)`}
    title={`${label} Vault size in micrometres`}
    values={values}
  />
);

interface VaultStat {
  label: string;
  func: (filter: MatrixFilter) => number[];
}
const VAULT_STATS: VaultStat[] = [
  {
    label: 'Average',
    func: getVaultAverages
  },
  {
    label: 'Minimum',
    func: getVaultMins
  },
  {
    label: 'Maximum',
    func: getVaultMaxs
  }
];

export const VaultStatRows = (filter: MatrixFilter) => (
  <>
    {VAULT_STATS.map((stat) => (
      <VaultSizeRow
        key={stat.label}
        label={stat.label}
        values={stat.func(filter)}
      />
    ))}
  </>
);
