import { LENS_SIZES, MYOPIA_LEVELS } from './data';

export const MatrixRow = ({
  label,
  title,
  values
}: {
  label: string;
  title: string;
  values: number[];
}) => (
  <tr>
    <th scope="row" title={title}>
      {label}
    </th>
    {values.map((val, index) => (
      <td key={index}>{val}</td>
    ))}
  </tr>
);

export const DividerRow = () => (
  <tr className="ledger-divider">
    <td colSpan={LENS_SIZES.length * MYOPIA_LEVELS.length + 1} />
  </tr>
);
