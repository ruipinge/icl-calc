import { DATA_POINTS, HISTOGRAM_DATA, VALUES } from '../db';
import {
  GoldenInputs,
  PINNED_CLOCK_ISO,
  rowToIclInputs,
  rowsSha256
} from './types';
import { LENS_SIZES, VaultRange } from '../matrix/data';
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
import {
  getVaultAverages,
  getVaultMaxs,
  getVaultMins
} from '../matrix/VaultStatRows';

import { buildZones } from '../normality/Gauge';
import expectedJson from './expected.json';
import { getNumEyes } from '../matrix';
import { getVaultDistribution } from '../matrix/VaultDistributionRows';
import inputsJson from './inputs.json';

const inputs = inputsJson as GoldenInputs;
const expected = expectedJson as any;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(PINNED_CLOCK_ISO));
});
afterEach(() => {
  vi.useRealTimers();
});

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
  // browser, no server and no build, and fails in milliseconds. If a row's
  // input values are edited without re-running the oracle capture, every row
  // assertion below would compare fresh inputs against a stale oracle and
  // fail in a way that looks like an application regression. This assertion
  // catches that first, with a message that says plainly what happened - not
  // just that two hashes differ. The digest is over `rows` only, with each
  // row's `why` excluded (see rowsSha256): editing prose must not force a
  // re-capture, only editing a value that can change a result should.
  it('was captured from the current src/golden/inputs.json', () => {
    const actualDigest = rowsSha256(inputs.rows);
    const recordedDigest = expected.capturedFrom.rowsSha256;
    const diagnosis =
      actualDigest === recordedDigest
        ? 'inputs.json rows match the sha256 recorded at capture time'
        : 'src/golden/inputs.json rows have changed since expected.json was ' +
          'captured (sha256 mismatch). This is stale-fixture drift, not an ' +
          'application defect: re-run the oracle capture (e2e/capture.spec.ts) ' +
          'to regenerate expected.json against the current inputs.json before ' +
          'trusting any other result in this file.';
    expect(diagnosis).toBe(
      'inputs.json rows match the sha256 recorded at capture time'
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

  // VAULT_SIZE_RANGES (src/matrix/VaultDistributionRows.tsx) is not exported,
  // so its five boundaries are duplicated here against the exported
  // VaultRange type. Keep in sync by hand if that file's own ranges ever
  // change - getVaultAverages/getVaultMins/getVaultMaxs need no such
  // duplication (their MatrixFilter comes straight from each fixture row),
  // but getVaultDistribution takes a range per row and there is no exported
  // source for those five ranges to import instead.
  const VAULT_SIZE_RANGES: VaultRange[] = [
    { max: 250 },
    { min: 250, max: 500 },
    { min: 500, max: 750 },
    { min: 750, max: 1000 },
    { min: 1000 }
  ];
  const VAULT_DISTRIBUTION_LABELS = [
    '% Vault < 250 (μm)',
    '% 250 < Vault < 500 (μm)',
    '% 500 < Vault < 750 (μm)',
    '% 750 < Vault < 1000 (μm)',
    '% 1000 < Vault (μm)'
  ];

  it.each(inputs.rows.map((r) => [r.id, r] as const))(
    'row %s reproduces the oracle matrix vault rows',
    (id, row) => {
      const filter = { ata: row.biometry.ata, clr: row.biometry.clr };
      const rendered = (label: string) =>
        expected.rows[id].matrix.rows
          .find((r: string[]) => r[0] === label)!
          .slice(1);

      expect(getVaultAverages(filter).map(String)).toEqual(
        rendered('Average Vault (μm)')
      );
      expect(getVaultMins(filter).map(String)).toEqual(
        rendered('Minimum Vault (μm)')
      );
      expect(getVaultMaxs(filter).map(String)).toEqual(
        rendered('Maximum Vault (μm)')
      );

      VAULT_SIZE_RANGES.forEach((range, index) => {
        const computed = getVaultDistribution({ filter, range }).map(String);
        expect(computed).toEqual(rendered(VAULT_DISTRIBUTION_LABELS[index]));
      });
    }
  );

  // Nothing else in this suite locks the Normality tab's clinical content -
  // the coloured band a measurement falls into. L2 captures only the
  // pointer's rendered `style` string, and valuePercent = (value - min) /
  // (max - min) * 100 in src/normality/linear-gauge/index.ts means every
  // intermediate quantile cancels out of that number; only the dataset's
  // overall min/max would ever show up there. This snapshot is what actually
  // pins the 2.5/25/75/97.5 percentile boundaries computed by buildZones over
  // the real 542-eye dataset, for all six gauge variables.
  //
  // Zone colours come back '' under jsdom - Gauge.tsx reads Bootstrap CSS
  // custom properties via getComputedStyle(document.body) at module scope,
  // which jsdom never populates - so only the min/max boundaries are the
  // point here; colours are not asserted.
  //
  // quantile() (used by buildZones) sorts its argument array IN PLACE, which
  // mutates the shared VALUES.* arrays from src/db.ts. That is safe only
  // because HISTOGRAM_DATA above is computed once, at db.ts module load,
  // before this test (or any test) runs - see "Known hazards recorded, not
  // fixed" in the design spec. The histogram snapshot test above was run
  // alongside this one and still passes unchanged, proving that ordering
  // holds.
  it('locks the Normality percentile bands over the real dataset', () => {
    expect({
      ata: buildZones({ values: VALUES.ATA }),
      clr: buildZones({ values: VALUES.CLR }),
      acd: buildZones({ values: VALUES.ACD }),
      aca: buildZones({ values: VALUES.ACA }),
      wtw: buildZones({ values: VALUES.WTW }),
      age: buildZones({ values: VALUES.AGE })
    }).toMatchSnapshot();
  });
});
