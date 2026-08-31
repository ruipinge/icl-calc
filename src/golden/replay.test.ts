import { DATA_POINTS, HISTOGRAM_DATA } from '../db';
import { GoldenInputs, PINNED_CLOCK_ISO, rowToIclInputs } from './types';
import {
  calcICLAxis,
  calcICLCylindre,
  calcICLSphere,
  calcICLSphericalEquivalent,
  round
} from '../formulas';
import {
  cornea2endothelium,
  probability,
  vaultPrediction
} from '../regression/formulas';

import { LENS_SIZES } from '../matrix/data';
import { createHash } from 'crypto';
import expectedJson from './expected.json';
import { getNumEyes } from '../matrix';
import inputsJson from './inputs.json';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const inputs = inputsJson as GoldenInputs;
const expected = expectedJson as any;

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(PINNED_CLOCK_ISO));
});
afterEach(() => jest.useRealTimers());

describe('golden master L1', () => {
  it('reads all 542 rows from data.csv', () => {
    expect(DATA_POINTS).toHaveLength(542);
  });

  it('derives the same histogram bins from the CSV', () => {
    // Locked here because the amCharts histogram is replaced in Phase 4b:
    // the chart may change, the numbers behind it may not.
    expect(HISTOGRAM_DATA).toMatchSnapshot();
  });

  it('was captured against the pinned clock', () => {
    expect(expected.clock).toBe(PINNED_CLOCK_ISO);
  });

  // Belongs here, not only in Task 7's browser replay: this needs no
  // browser, no server and no build, and fails in milliseconds. If
  // inputs.json is edited without re-running the oracle capture, every row
  // assertion below would compare fresh inputs against a stale oracle and
  // fail in a way that looks like an application regression. This assertion
  // catches that first, with a message that says plainly what happened - not
  // just that two hashes differ.
  it('was captured from the current src/golden/inputs.json', () => {
    const actualDigest = createHash('sha256')
      .update(readFileSync(resolve(__dirname, 'inputs.json')))
      .digest('hex');
    const recordedDigest = expected.capturedFrom.inputsSha256;
    const diagnosis =
      actualDigest === recordedDigest
        ? 'inputs.json matches the sha256 recorded at capture time'
        : 'src/golden/inputs.json has changed since expected.json was ' +
          'captured (sha256 mismatch). This is stale-fixture drift, not an ' +
          'application defect: re-run the oracle capture (e2e/capture.spec.ts) ' +
          'to regenerate expected.json against the current inputs.json before ' +
          'trusting any other result in this file.';
    expect(diagnosis).toBe(
      'inputs.json matches the sha256 recorded at capture time'
    );
  });

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle ICL Power',
    (id, row) => {
      const v = rowToIclInputs(row);
      expect(String(v.patient.age())).toBe(expected.rows[id].age);
      expect({
        iclSphere: String(calcICLSphere(v)),
        iclCylindre: String(calcICLCylindre(v)),
        iclAxis: String(calcICLAxis(v.spectacleRefraction.axis)),
        iclSphericalEquivalent: String(calcICLSphericalEquivalent(v))
      }).toEqual(expected.rows[id].patient);
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle regression table',
    (id, row) => {
      const v = rowToIclInputs(row);
      const ri = {
        acd: v.biometry.acd,
        ata: v.biometry.ata,
        clr: v.biometry.clr,
        se: calcICLSphericalEquivalent(v),
        age: v.patient.age()
      };
      // Rendered rows are [label, vault, endothelium]; compare the numbers only.
      const rendered = expected.rows[id].regression.prediction
        .slice(1)
        .map((r: string[]) => r.slice(1));
      const computed = LENS_SIZES.map((size) => [
        String(round(vaultPrediction({ ri, lensSizeId: size.id }))),
        String(round(cornea2endothelium({ ri, lensSizeId: size.id })))
      ]);
      expect(computed).toEqual(rendered);

      const renderedProb = expected.rows[id].regression.probability
        .slice(1)
        .map((r: string[]) => r.slice(1));
      const computedProb = LENS_SIZES.map((size) => [
        String(round(probability({ ri, lensSizeId: size.id }) * 100, 1))
      ]);
      expect(computedProb).toEqual(renderedProb);
    }
  );

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle matrix eye counts',
    (id, row) => {
      const counts = getNumEyes({
        ata: row.biometry.ata,
        clr: row.biometry.clr
      });
      // "Number of Eyes" is the first body row; cell 0 is the label.
      const rendered = expected.rows[id].matrix.rows
        .find((r: string[]) => r[0] === 'Number of Eyes')!
        .slice(1);
      expect(counts.map(String)).toEqual(rendered);
    }
  );
});
