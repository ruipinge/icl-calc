import { Capture, fillRow, openApp, readAll } from './lib/app';

import type { GoldenInputs } from '../src/golden/types';
import inputsJson from '../src/golden/inputs.json';
import { resolve } from 'path';
import { test } from '@playwright/test';
import { writeFileSync } from 'fs';

const inputs = (inputsJson as unknown) as GoldenInputs;

const OUT = resolve(__dirname, '../src/golden/expected.json');

test('capture the oracle', async ({ page }) => {
  test.setTimeout(180_000);
  await openApp(page);

  const rows: Record<string, Capture> = {};
  for (const row of inputs.rows) {
    await fillRow(page, row);
    rows[row.id] = await readAll(page);
  }

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        README:
          'CAPTURED FROM THE DEPLOYED ORACLE. DO NOT REGENERATE. ' +
          'If a value here must change, see spec section 7.3 (the stop rule): ' +
          'it requires an oracle/ branch and explicit sign-off.',
        capturedFrom: {
          sha: '789ac2de9b5886878763a8c06f1a4f71db173270',
          url: 'https://ruipinge.github.io/icl-calc/',
          version: '1.7.0'
        },
        clock: inputs.clock,
        rows
      },
      null,
      2
    ) + '\n'
  );
});
