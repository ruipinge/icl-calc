import { LENS_CLASSES, LENS_SIZES } from '../matrix/data';
import {
  RegressionInfo,
  cornea2endothelium,
  vaultPrediction
} from './formulas';

import { round } from '../formulas';

export const VaultPrediction = (values: RegressionInfo) => (
  <>
    <h4>Vault Prediction</h4>
    <table className="ledger compact">
      <thead>
        <tr>
          <th scope="col">Lens Size</th>
          <th scope="col">Vault (μm)</th>
          <th scope="col">Corneal Endothelium to ICL (mm)</th>
        </tr>
      </thead>
      <tbody>
        {LENS_SIZES.map((size, index) => (
          <tr key={size.id}>
            <th scope="row" className={`${LENS_CLASSES[index]} numeric`}>
              {size.label}
            </th>
            <td>
              {round(
                vaultPrediction({
                  ri: values,
                  lensSizeId: size.id
                })
              )}
            </td>
            <td>
              {round(
                cornea2endothelium({
                  ri: values,
                  lensSizeId: size.id
                })
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);
