import { MatrixFilter, filterFlatRows } from './data';

import { MatrixRow } from './components';
import { Row } from '../db';
import { round } from '../formulas';

export const getVaultVals = ({
  filter,
  reducer
}: {
  filter: MatrixFilter;
  reducer: (rows: Row[]) => number;
}): number[] =>
  filterFlatRows(filter).map((rows: Row[]) => round(reducer(rows), 5));

export const getVaultAverages = (filter: MatrixFilter): number[] =>
  getVaultVals({
    filter,
    reducer: (rows: Row[]) =>
      rows.reduce((memo, row) => memo + row[11], 0) / rows.length || 0
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
    reducer: (rows: Row[]) =>
      rows.reduce(
        (memo, row) =>
          memo === 0 || comparator(memo, row[11]) ? row[11] : memo,
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
    label={`${label} Vault`}
    title={`${label} Vault size in millimetres`}
    values={values}
  />
);

export const VaultStatRows = (filter: MatrixFilter) => (
  <>
    <VaultSizeRow label="Average" values={getVaultAverages(filter)} />
    <VaultSizeRow label="Minimum" values={getVaultMins(filter)} />
    <VaultSizeRow label="Maximum" values={getVaultMaxs(filter)} />
  </>
);
