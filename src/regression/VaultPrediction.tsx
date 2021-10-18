import {
  RegressionInfo,
  cornea2endothelium,
  vaultPrediction
} from './formulas';

import { LENS_SIZES } from '../matrix/data';
import { round } from '../formulas';

export const VaultPrediction = (values: RegressionInfo) => (
  <>
    <h4>Vault Prediction</h4>
    <table className="table table-bordered table-hover">
      <thead>
        <tr>
          <th scope="col" className="col-4">
            Lens Size
          </th>
          <th scope="col" className="col-4 text-right">
            Vault (μm)
          </th>
          <th scope="col" className="col-4 text-right">
            Corneal Endothelium to ICL (mm)
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
                vaultPrediction({
                  ri: values,
                  lensSizeId: size.id
                })
              )}
            </td>
            <td className="col-4 text-right">
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
