import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { gotoTab } from './lib/app';
import { mkdirSync } from 'fs';

/**
 * Captures each of the six Normality histograms as a PNG, for
 * before/after comparison across the amCharts -> hand-rolled SVG
 * replacement (issue #51).
 *
 * This is a capture tool, not an assertion: it is deliberately NOT part
 * of the `test` or `replay` projects and never runs in CI. The numeric
 * gate for #51 is the L1 HISTOGRAM_DATA snapshot, which proves the data
 * behind the chart is unchanged. This proves what the chart *looks*
 * like, which no automated gate covers and which the owner reviews by
 * eye.
 *
 * Nothing here depends on form input: HISTOGRAM_DATA is derived from
 * src/data.csv at module load and is identical on every render, so the
 * capture needs no fixture and no pinned clock.
 *
 * Run: OUT_DIR=<dir> SUBJECT_ONLY=1 npx playwright test --project=visual
 */

// Order is fixed by GRAPH_CONFIGS in src/normality/index.tsx.
const METRICS = ['ata', 'clr', 'acd', 'aca', 'wtw', 'age'] as const;

const OUT_DIR = process.env.OUT_DIR || 'histogram-shots';

/**
 * amCharts animates its columns in on first render, and drives that
 * animation in JS rather than CSS - so Playwright's
 * `animations: 'disabled'` screenshot option does not freeze it. Waiting
 * a fixed duration would be a guess that goes stale on a slower machine.
 * Instead, sample the rendered SVG markup until two consecutive reads
 * agree, which is true only once the animation has settled.
 */
const waitForStableSvg = async (locator: Locator) => {
  let previous = '';
  for (let attempt = 0; attempt < 40; attempt++) {
    const current = await locator.innerHTML();
    if (current && current === previous) {
      return;
    }
    previous = current;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('histogram SVG never stopped changing');
};

test('capture the six normality histograms', async ({ page }) => {
  mkdirSync(OUT_DIR, { recursive: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('.');

  // Clicking the nav link, never page.goto - a document load would remount
  // React and reset Formik to INITIAL_VALUES. Irrelevant to the histograms
  // themselves, but it keeps this capture on the same read path as the
  // golden master's, so the two cannot drift apart.
  await gotoTab(page, 'Biometric Normality');

  const columns = page.locator('.row > .col-md-4');
  await expect(columns).toHaveCount(METRICS.length);

  for (const [index, metric] of METRICS.entries()) {
    const histogram = columns.nth(index).locator('> div').first();
    await expect(histogram.locator('svg')).toBeVisible();
    await waitForStableSvg(histogram);

    await histogram.screenshot({ path: `${OUT_DIR}/${metric}.png` });
  }

  // One full-tab shot for layout context - column widths, spacing between
  // a histogram and the gauge under it, and how the six sit as a grid.
  await page.screenshot({
    path: `${OUT_DIR}/_full-tab.png`,
    fullPage: true
  });
});
