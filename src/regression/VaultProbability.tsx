import { RegressionInfo, probability } from './formulas';

import { LENS_SIZES } from '../matrix/data';
import { round } from '../formulas';

export const VaultProbability = (values: RegressionInfo) => (
  <>
    <h4>{'Probability of 250 < Vault < 1000 (μm)'}</h4>
    <table className="table table-bordered table-hover">
      <thead>
        <tr>
          <th scope="col" className="col-4">
            Lens Size
          </th>
          <th scope="col" className="col-4 text-right">
            Probability (%)
          </th>
        </tr>
      </thead>
      <tbody>
        {LENS_SIZES.map((size) => (
          <tr key={size.id}>
            <th scope="col" className="col-4">
              {size.label}
            </th>
            <td className="col-4 text-right">
              {round(
                probability({
                  ri: values,
                  lensSizeId: size.id
                }) * 100,
                1
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);
