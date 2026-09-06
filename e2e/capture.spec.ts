import { Capture, fillRow, openApp, readAll } from './lib/app';
import { expect, test } from '@playwright/test';
import { writeFileSync } from 'fs';

import type { GoldenInputs } from '../src/golden/types';
import { rowsSha256 } from '../src/golden/types';
import { version as playwrightVersion } from '@playwright/test/package.json';
import inputsJson from '../src/golden/inputs.json';
import { resolve } from 'path';

const inputs = (inputsJson as unknown) as GoldenInputs;

const OUT = resolve(__dirname, '../src/golden/expected.json');

// What is actually served is whatever e2e/.serve/icl-calc points at. The
// provenance recorded below is only trustworthy if the served build is checked
// against it, so both facts are asserted in the page before anything is
// captured. Deliberately here and not in the shared openApp: Task 7's replay
// subject is a local `npm run build` that carries a different
// import.meta.env.VITE_APP_VERSION (from vite.config.ts's `define`, sourced
// from package.json at build time) and different content hashes.
const ORACLE_VERSION = '1.7.0';
const ORACLE_MAIN_CHUNK = '/icl-calc/static/js/main.86697131.chunk.js';

test('capture the oracle', async ({ page }) => {
  test.setTimeout(180_000);
  await openApp(page);

  // Coarse identity: the version the build reports about itself, rendered as
  // visible link text by src/misc/Footer.tsx.
  await expect(
    page.getByRole('link', { name: `v${ORACLE_VERSION}` })
  ).toBeVisible();
  // Exact identity: a CRA content hash. Any rebuild, of any commit, moves it -
  // which the version string alone would not catch.
  await expect(page.locator(`script[src="${ORACLE_MAIN_CHUNK}"]`)).toHaveCount(
    1
  );

  const rows: Record<string, Capture> = {};
  for (const row of inputs.rows) {
    await fillRow(page, row);
    rows[row.id] = await readAll(page);
  }

  const browserVersion = page.context().browser()?.version();

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        README:
          'CAPTURED FROM THE DEPLOYED ORACLE by e2e/capture.spec.ts. This file ' +
          'is generated: hand-editing a value in it is forbidden at every ' +
          'point, no exceptions. Re-running the capture is legitimate up to ' +
          'and including Task 8 - the plan requires it if the harness is found ' +
          'to read the DOM wrongly. From Task 8 commit onward the fixture is ' +
          'immutable: if a value here must change, see spec section 7.3 (the ' +
          'stop rule), which requires an oracle/ branch and explicit sign-off. ' +
          'capturedFrom.rowsSha256 is the sha256 of the rows array in ' +
          'src/golden/inputs.json (each row\'s `why` excluded, everything else ' +
          'included) as it stood when this file was generated; if it no longer ' +
          'matches, an input value was edited without a re-capture and any ' +
          'replay failure is fixture drift, not an application defect. Editing ' +
          'only a `why` string never changes this digest. capturedFrom.playwrightVersion ' +
          'and .chromiumVersion record what read the DOM: expected.json\'s gauge ' +
          'values are Chromium-serialised CSS strings, and a different Chromium ' +
          'build can render a handful of pixels differently across a future ' +
          'npm install, which would present as an application regression under ' +
          'the stop rule if the browser that produced them were not on record.',
        capturedFrom: {
          sha: '789ac2de9b5886878763a8c06f1a4f71db173270',
          url: 'https://ruipinge.github.io/icl-calc/',
          version: ORACLE_VERSION,
          mainChunk: ORACLE_MAIN_CHUNK,
          rowsSha256: rowsSha256(inputs.rows),
          playwrightVersion,
          chromiumVersion: browserVersion ?? null
        },
        clock: inputs.clock,
        rows
      },
      null,
      2
    ) + '\n'
  );
});
