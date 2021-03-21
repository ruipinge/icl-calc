import { DividerRow, MatrixRow } from './components';
import { MYOPIA_LEVEL, Row } from '../db';
import { MatrixFilter, filterFlatRows } from './data';

import { VaultDistributionRows } from './VaultDistributionRows';
import { VaultStatRows } from './VaultStatRows';

export const getNumEyes = (filter: MatrixFilter): number[] =>
  filterFlatRows(filter).map((rows: Row[]) => rows.length);

const LensHeaderCol = ({ label }: { label: string }) => (
  <th scope="col" colSpan={MYOPIA_LEVEL.length} className="text-right">
    {label}
  </th>
);

const MyopiaHeaderCol = ({ label }: { label: string }) => (
  <th scope="col" className="text-right">
    {label}
  </th>
);

const MyopiaHeaderColGroup = () => (
  <>
    <MyopiaHeaderCol label="Low" />
    <MyopiaHeaderCol label="Moderate" />
    <MyopiaHeaderCol label="High" />
  </>
);

export const Matrix = (filter: MatrixFilter) => (
  <table className="table table-bordered table-hover">
    <thead>
      <tr>
        <th scope="col">Lens Size</th>
        <LensHeaderCol label="12.6 mm" />
        <LensHeaderCol label="13.2 mm" />
        <LensHeaderCol label="13.7 mm" />
      </tr>
      <tr>
        <th scope="col">Myopia</th>
        <MyopiaHeaderColGroup />
        <MyopiaHeaderColGroup />
        <MyopiaHeaderColGroup />
      </tr>
    </thead>
    <tbody>
      <MatrixRow
        label="Number of Eyes"
        title="Number of Eyes matching the column criteria"
        values={getNumEyes(filter)}
      />
      <DividerRow />
      <VaultStatRows {...filter} />
      <DividerRow />
      <VaultDistributionRows {...filter} />
    </tbody>
  </table>
);
