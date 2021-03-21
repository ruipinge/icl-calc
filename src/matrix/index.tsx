import { DividerRow, MatrixRow } from './components';
import {
  LENS_SIZES,
  MYOPIA_LEVELS,
  MatrixFilter,
  NUM_DATA_POINTS,
  filterFlatRows
} from './data';

import { DataPoint } from '../db';
import { VaultDistributionRows } from './VaultDistributionRows';
import { VaultStatRows } from './VaultStatRows';

export const getNumEyes = (filter: MatrixFilter): number[] =>
  filterFlatRows(filter).map((rows: DataPoint[]) => rows.length);

const LensHeaderCol = ({ label }: { label: string }) => (
  <th scope="col" colSpan={MYOPIA_LEVELS.length} className="text-right">
    {label}
  </th>
);

const MyopiaHeaderCol = ({
  label,
  title
}: {
  label: string;
  title: string;
}) => (
  <th scope="col" className="text-right" title={title}>
    {label}
  </th>
);

const MyopiaHeaderColGroup = () => (
  <>
    {MYOPIA_LEVELS.map((level) => (
      <MyopiaHeaderCol label={level.label} title={level.title} key={level.id} />
    ))}
  </>
);

export const Matrix = (filter: MatrixFilter) => (
  <>
    <table className="table table-bordered table-hover">
      <thead>
        <tr>
          <th scope="col">Lens Size</th>
          {LENS_SIZES.map((size) => (
            <LensHeaderCol label={size.label} key={size.id} />
          ))}
        </tr>
        <tr>
          <th scope="col">Myopia</th>
          {LENS_SIZES.map((size) => (
            <MyopiaHeaderColGroup key={size.id} />
          ))}
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
    <ul className="list-inline">
      <li className="list-inline-item">
        <strong>Angle to Angle (AtA): </strong>
        {filter.ata} mm.
      </li>
      <li className="list-inline-item">
        <strong>Crystaline Lens Rise (CLR): </strong>
        {filter.clr} mm.
      </li>
      <li className="list-inline-item">
        <strong>Number of matching Eyes: </strong>
        {getNumEyes(filter).reduce((acc, a) => acc + a, 0)}/{NUM_DATA_POINTS}.
      </li>
    </ul>
  </>
);
