import { RegressionInfo } from './formulas';
import { VaultPrediction } from './VaultPrediction';
import { VaultProbability } from './VaultProbability';

export const Regression = (values: RegressionInfo) => (
  <>
    <section className="regression-block">
      <VaultPrediction {...values} />
    </section>
    <hr />
    <section className="regression-block">
      <VaultProbability {...values} />
    </section>
  </>
);
