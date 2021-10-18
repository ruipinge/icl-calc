import { RegressionInfo } from './formulas';
import { VaultPrediction } from './VaultPrediction';
import { VaultProbability } from './VaultProbability';

export const Regression = (values: RegressionInfo) => (
  <>
    <div className="row">
      <div className="col-md-6">
        <VaultPrediction {...values} />
      </div>
    </div>
    <hr />
    <div className="row">
      <div className="col-md-5">
        <VaultProbability {...values} />
      </div>
    </div>
  </>
);
