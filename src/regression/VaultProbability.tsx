import { LENS_CLASSES, LENS_SIZES } from '../matrix/data';
import { RegressionInfo, probability } from './formulas';

import { round } from '../formulas';

export const VaultProbability = (values: RegressionInfo) => (
  <>
    <h4>{'Probability of 250 < Vault < 1000 (μm)'}</h4>
    <table className="ledger compact">
      <thead>
        <tr>
          <th scope="col">Lens Size</th>
          <th scope="col">Probability (%)</th>
        </tr>
      </thead>
      <tbody>
        {LENS_SIZES.map((size, index) => (
          <tr key={size.id}>
            <th scope="row" className={LENS_CLASSES[index]}>
              {size.label}
            </th>
            <td>
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
