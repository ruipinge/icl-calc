import { expect, test } from '@playwright/test';
import { fillRow, openApp, readAll } from './lib/app';

import { createHash } from 'crypto';
import expected from '../src/golden/expected.json';
import inputs from '../src/golden/inputs.json';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const INPUTS = resolve(__dirname, '../src/golden/inputs.json');

/** sha256 of the inputs file *as bytes*, so any edit at all changes it. */
const sha256OfFile = (path: string) =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

// Belongs here in addition to src/golden/replay.test.ts (L1): if inputs.json
// were edited without a re-capture, every row assertion below would compare
// today's inputs against a stale oracle and fail in a way indistinguishable
// from a real regression. Checking this first, with a message that names the
// actual cause, is what keeps stale-fixture drift from being reported as the
// migration's central risk when it is not.
test('the fixture inputs match what the oracle was captured from', () => {
  const actualDigest = sha256OfFile(INPUTS);
  const recordedDigest = (expected as any).capturedFrom.inputsSha256;
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

test('the build under test reproduces the oracle exactly', async ({
  page
}) => {
  test.setTimeout(180_000);
  await openApp(page);

  for (const row of (inputs as any).rows) {
    await fillRow(page, row);
    const actual = await readAll(page);
    expect(actual, `golden master row ${row.id}`).toEqual(
      (expected as any).rows[row.id]
    );
  }
});
