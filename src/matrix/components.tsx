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
    {values.map((val, i) => (
      <td key={i} className="text-right">
        {val}
      </td>
    ))}
  </tr>
);

export const DividerRow = () => (
  <tr className="table-bordered">
    <td colSpan={LENS_SIZES.length * MYOPIA_LEVELS.length + 1} />
  </tr>
);
