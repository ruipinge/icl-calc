import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoTab, openApp } from './lib/app';

/**
 * Visual and structural coverage for every route, at two viewports (#121).
 *
 * Before this file, CI could not observe a visual regression at all. L1
 * asserted authored class strings and L2 asserts computed clinical values;
 * both stay green while the page falls apart. `histogram-visual.spec.ts` is
 * often described as the visual coverage, but its own header says it is a
 * capture tool that never runs in CI, and nothing in the workflow invoked it
 * - the only Playwright invocation was `--project=replay`. So the count of
 * visual assertions in CI was zero, not one component's worth.
 *
 * Two fixture kinds, deliberately, because they fail at different things:
 *
 *   aria snapshots  roles and accessible names as YAML. Platform-independent,
 *                   diffable, and stable across restyling - so they survive
 *                   the reskin and catch a structural change inside it.
 *   screenshots     appearance. These WILL be regenerated wholesale by #122,
 *                   which is correct: that phase is the deliberate visual
 *                   change, and regenerating there is a reviewed act against
 *                   Playwright's diff images. Their value is what they catch
 *                   afterwards, and - during #122 - an unintended change to a
 *                   route the reskin was not editing.
 *
 * Screenshots are pixel fixtures and therefore platform-bound. They are
 * generated and asserted inside the official Playwright container so that a
 * developer's machine and the runner agree exactly; see e2e/README.md.
 *
 * This is NOT the layout baseline. That is a reference captured for #122 and
 * attached to the issue rather than committed, precisely because a fixture
 * keyed to control styling would fail on every restyle and be disabled within
 * a day.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

const ROUTES = [
  { name: 'patient', tab: null },
  { name: 'normality', tab: 'Biometric Normality' },
  { name: 'matrix', tab: 'Floating Matrix' },
  { name: 'regression', tab: 'Regression' }
] as const;

/**
 * The footer renders the release tag and the build's commit, which differ
 * between a developer's build (`dev`, and package.json's committed version)
 * and CI's (a real tag and GITHUB_SHA). Masking them is what keeps the
 * screenshots about the page rather than about who built it. Nothing else on
 * any route varies by build.
 */
const buildStamp = (page: Page) => [
  page.locator('footer a[href*="/releases/tag/"]'),
  page.locator('footer a[href*="/commit/"]')
];

/**
 * The form is left at INITIAL_VALUES: an empty patient with zeroed biometry.
 * That is the deterministic state - every rendered number is then derived
 * from constants or from src/data.csv, which does not change - and it is also
 * the state that shows the most structure, since no validation styling is
 * triggered. The clock is pinned by openApp regardless, because
 * PatientInfo.age() reads Date.now().
 */
const open = async (page: Page, tab: string | null) => {
  await openApp(page);
  if (tab !== null) {
    await gotoTab(page, tab);
  }
};

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name} looks right`, async ({ page }) => {
        await open(page, route.tab);

        await expect(page).toHaveScreenshot(
          `${route.name}-${viewport.name}.png`,
          { fullPage: true, mask: buildStamp(page) }
        );
      });
    }

    /*
     * The shell is on every route, so a full-page shot already contains it -
     * but only at whatever scale that route's content forces. These pin it
     * on its own, which is what makes a broken navbar or footer fail as a
     * small, readable diff rather than as a shifted 900px page.
     */
    test('the shell looks right', async ({ page }) => {
      await open(page, null);

      await expect(page.locator('nav.navbar')).toHaveScreenshot(
        `shell-navbar-${viewport.name}.png`
      );
      // The tab strip is the first list on the page; the footer's link list
      // is the second. Addressed by role rather than by `.nav-pills` so the
      // locator survives #122 dropping Bootstrap.
      await expect(page.getByRole('list').first()).toHaveScreenshot(
        `shell-tabs-${viewport.name}.png`
      );
      await expect(page.locator('footer')).toHaveScreenshot(
        `shell-footer-${viewport.name}.png`,
        { mask: buildStamp(page) }
      );
    });
  });
}

/*
 * Structure, asserted once per route rather than once per viewport. This
 * application is responsive through CSS alone - no route renders different
 * elements at a different width - so a second copy per viewport would record
 * the same tree twice and double what #122 has to review. Verified rather
 * than assumed: the test below compares the two viewports' trees directly,
 * and fails if that ever stops being true.
 */
for (const route of ROUTES) {
  test(`${route.name} exposes the expected roles and names`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, route.tab);

    await expect(page.locator('body')).toMatchAriaSnapshot({
      name: `${route.name}.aria.yml`
    });
  });
}

test('the accessibility tree does not change with viewport', async ({
  page
}) => {
  const trees: string[] = [];

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });
    await open(page, null);
    trees.push(await page.locator('body').ariaSnapshot());
  }

  // If this ever fails, the aria snapshots above need to become per-viewport
  // - a route has started rendering different elements rather than merely
  // laying the same ones out differently.
  expect(trees[0]).toBe(trees[1]);
});
