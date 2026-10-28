import { DividerRow, MatrixRow } from './components';
import {
  LENS_CLASSES,
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

const LensHeaderCol = ({
  label,
  className
}: {
  label: string;
  className: string;
}) => (
  <th scope="col" colSpan={MYOPIA_LEVELS.length} className={className}>
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
  <th scope="col" title={title}>
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
    <div className="ledger-scroll">
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Lens Size</th>
            {LENS_SIZES.map((size, index) => (
              <LensHeaderCol
                label={size.label}
                className={LENS_CLASSES[index]}
                key={size.id}
              />
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
    </div>
    <ul className="ledger-summary" data-testid="matrix-summary">
      <li>
        <strong>Angle to Angle (AtA): </strong>
        {filter.ata} mm.
      </li>
      <li>
        <strong>Crystaline Lens Rise (CLR): </strong>
        {filter.clr * 0.001} mm.
      </li>
      <li>
        <strong>Number of matching Eyes: </strong>
        {getNumEyes(filter).reduce((acc, a) => acc + a, 0)}/{NUM_DATA_POINTS}.
      </li>
    </ul>
  </>
);
