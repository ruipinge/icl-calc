import { expect, test } from '@playwright/test';
import { fillRow, openApp, readAll } from './lib/app';

import type { GoldenInputs } from '../src/golden/types';
import { rowsSha256 } from '../src/golden/types';
import expected from '../src/golden/expected.json';
import inputsJson from '../src/golden/inputs.json';

const inputs = (inputsJson as unknown) as GoldenInputs;

// Belongs here in addition to src/golden/replay.test.ts (L1): if a row's
// input values were edited without a re-capture, every row assertion below
// would compare today's inputs against a stale oracle and fail in a way
// indistinguishable from a real regression. Checking this first, with a
// message that names the actual cause, is what keeps stale-fixture drift
// from being reported as the migration's central risk when it is not. The
// digest is over `rows` only, with each row's `why` excluded (see
// rowsSha256), so editing prose never trips this.
test('the fixture inputs match what the oracle was captured from', () => {
  const actualDigest = rowsSha256(inputs.rows);
  const recordedDigest = (expected as any).capturedFrom.rowsSha256;
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

test('the build under test reproduces the oracle exactly', async ({
  page
}) => {
  test.setTimeout(180_000);
  await openApp(page);

  // Vacuous-pass guard: `for (const row of [])` below would otherwise pass
  // trivially if inputs.rows were ever empty, which is exactly the failure
  // mode these gates exist to prevent.
  expect(inputs.rows).toHaveLength(10);

  for (const row of inputs.rows) {
    await fillRow(page, row);
    const actual = await readAll(page);
    expect(actual, `golden master row ${row.id}`).toEqual(
      (expected as any).rows[row.id]
    );
  }
});
