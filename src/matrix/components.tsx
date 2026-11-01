import { LENS_SIZES, MYOPIA_LEVELS } from './data';

/*
 * `numeric` marks a row header that holds numbers ("% 250 < Vault < 500
 * (μm)"), so it is set in the numeric face like the values beside it (#193).
 */
export const MatrixRow = ({
  label,
  title,
  values,
  numeric = false
}: {
  label: string;
  title: string;
  values: number[];
  numeric?: boolean;
}) => (
  <tr>
    <th scope="row" title={title} className={numeric ? 'numeric' : undefined}>
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
