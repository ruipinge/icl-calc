import { Page, expect } from '@playwright/test';

import type { GoldenRow } from '../../src/golden/types';
import inputs from '../../src/golden/inputs.json';

// Single source of truth. Deliberately NOT a local constant: if this drifted
// from inputs.json, capture.spec.ts would still record inputs.clock while
// actually driving the page at a different time, and the drift would be
// invisible in the fixture.
const PINNED_CLOCK_ISO = inputs.clock;

export interface Capture {
  age: string;
  patient: Record<string, string>;
  matrix: { rows: string[][]; footer: string[] };
  regression: { prediction: string[][]; probability: string[][] };
  normality: { pointers: (string | null)[] };
}

const ICL_OUTPUTS = [
  'iclSphere',
  'iclCylindre',
  'iclAxis',
  'iclSphericalEquivalent'
];

type TabLabel =
  | 'Patient'
  | 'Biometric Normality'
  | 'Floating Matrix'
  | 'Regression';

/** Pin the clock BEFORE navigation - PatientInfo.age() reads Date.now(). */
export const openApp = async (page: Page) => {
  await page.clock.install({ time: new Date(PINNED_CLOCK_ISO) });
  await page.goto('./');
  await expect(page.locator('input[name="biometry.ata"]')).toBeVisible();
};

/**
 * Switch tabs by clicking the react-router NavLink.
 *
 * NEVER use page.goto() for this. The whole app - Formik included - is mounted
 * above the Router, so a document load remounts React and resets the form to
 * INITIAL_VALUES (all zeros). A capture taken that way would still be produced
 * cleanly and would still look plausible; it would just be the calculator's
 * answer for an empty patient. Clicking a NavLink is a same-document route
 * change and cannot reset Formik state.
 */
export const gotoTab = async (page: Page, label: TabLabel) => {
  const link = page.getByRole('link', { name: label, exact: true });
  await link.click();
  // NavLink gets activeClassName="active" only once the route actually matches.
  await expect(link).toHaveClass(/\bactive\b/);
};

const setNumber = async (page: Page, name: string, value: number) => {
  const field = page.locator(`input[name="${name}"]`);
  await field.fill(String(value));
};

/**
 * Start a fresh row.
 *
 * The reload here is deliberate and is the one place a form reset is wanted:
 * every row must be entered into a pristine form. `goto('./')` alone is not
 * enough - the previous row ends on a URL that differs only by its fragment,
 * which the browser treats as a same-document navigation. The empty-name
 * assertion is the proof that the reset really happened.
 */
export const fillRow = async (page: Page, row: GoldenRow) => {
  await page.goto('./');
  await page.reload();
  await expect(page.locator('input[name="patient.name"]')).toHaveValue('');

  await page.locator('input[name="patient.name"]').fill(row.patient.name);
  await page
    .locator('input[name="patient.dateOfBirth"]')
    .fill(row.patient.dateOfBirth);
  await page
    .locator('select[name="patient.eye"]')
    .selectOption(row.patient.eye);

  for (const [k, v] of Object.entries(row.biometry)) {
    await setNumber(page, `biometry.${k}`, v as number);
  }
  for (const [k, v] of Object.entries(row.corneaProfile)) {
    if (k === 'previousSurgery') continue;
    await setNumber(page, `corneaProfile.${k}`, v as number);
  }
  await page
    .locator('select[name="corneaProfile.previousSurgery"]')
    .selectOption(row.corneaProfile.previousSurgery);
  for (const [k, v] of Object.entries(row.spectacleRefraction)) {
    await setNumber(page, `spectacleRefraction.${k}`, v as number);
  }

  // Formik recomputes synchronously on change; settle the render before reading.
  await expect(page.locator('input[name="iclSphere"]')).toBeVisible();
  // The last field written must have landed before anything is read.
  await expect(
    page.locator('input[name="spectacleRefraction.vertex"]')
  ).toHaveValue(String(row.spectacleRefraction.vertex));
};

const tableRows = async (page: Page, index: number): Promise<string[][]> =>
  page
    .locator('table')
    .nth(index)
    .locator('tr')
    .evaluateAll((trs) =>
      trs.map((tr) =>
        Array.from(tr.querySelectorAll('th,td')).map((c) =>
          (c.textContent ?? '').trim()
        )
      )
    );

export const readAll = async (page: Page): Promise<Capture> => {
  // --- Patient tab (already there: fillRow leaves us on it)
  // Noted now, re-checked after the tab round-trip below. If a tab switch ever
  // becomes a document load again, Formik resets to INITIAL_VALUES and every
  // non-Patient reading in this Capture silently becomes the answer for an
  // empty patient. This assertion is what stops that being invisible.
  const ataOnEntry = await page
    .locator('input[name="biometry.ata"]')
    .inputValue();

  const patient: Record<string, string> = {};
  for (const name of ICL_OUTPUTS) {
    patient[name] = await page.locator(`input[name="${name}"]`).inputValue();
  }
  const age = await page.locator('input[name="age"]').inputValue();

  // --- Matrix tab
  await gotoTab(page, 'Floating Matrix');
  await expect(page.locator('table')).toHaveCount(1);
  const matrixRows = await tableRows(page, 0);
  const footer = await page
    .locator('ul.list-inline li')
    .evaluateAll((ls) => ls.map((l) => (l.textContent ?? '').trim()));

  // --- Regression tab
  await gotoTab(page, 'Regression');
  await expect(page.locator('table')).toHaveCount(2);
  const prediction = await tableRows(page, 0);
  const probability = await tableRows(page, 1);

  // --- Normality tab
  // The gauge pointer is an <svg> with style="left: calc(X% - 2px)". It is NOT
  // rendered when the value falls outside the zone range, so null is a real
  // and meaningful captured value. amCharts also renders SVG, hence the scope
  // to the gauge container's inline margin-left.
  await gotoTab(page, 'Biometric Normality');
  const gauges = page.locator('div[style*="margin-left: 71px"]');
  await expect(gauges).toHaveCount(6);
  const pointers = await gauges.evaluateAll((els) =>
    els.map((el) => {
      const svg = el.querySelector('svg');
      return svg ? svg.getAttribute('style') : null;
    })
  );

  await gotoTab(page, 'Patient');
  await expect(page.locator('input[name="biometry.ata"]')).toHaveValue(
    ataOnEntry
  );

  return {
    age,
    patient,
    matrix: { rows: matrixRows, footer },
    regression: { prediction, probability },
    normality: { pointers }
  };
};
