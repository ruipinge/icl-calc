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
 * The footer renders the release tag and the commit the bundle was built
 * from, and both vary by build: a developer's says `dev` and package.json's
 * committed version, CI's says GITHUB_SHA and whatever tag the release step
 * resolved. Neither is a property of the page, so both are rewritten to fixed
 * values before anything is captured.
 *
 * Masking is not sufficient and was tried first. A mask paints over pixels,
 * so it does nothing for the accessibility tree - all four aria snapshots
 * failed in CI on `(dev)` versus `(b054e56)` - and it does not even fix the
 * pixels, because the two strings are different widths and the footer reflows
 * around the masked box. Normalising the text is what makes both fixture
 * kinds independent of who produced the build.
 *
 * This is the only DOM the visual tests touch, and it is deliberately narrow:
 * two anchors' text and href, nothing else. Their real content is asserted by
 * src/misc/Footer.test.tsx, which is where it belongs.
 */
const PINNED_VERSION = '0.0.0';
const PINNED_COMMIT = '0000000';

const pinBuildStamp = async (page: Page) => {
  await page.evaluate(
    ([version, commit]) => {
      const release = document.querySelector<HTMLAnchorElement>(
        'footer a[href*="/releases/tag/"]'
      );
      if (release) {
        release.textContent = `v${version}`;
        release.href = `https://github.com/ruipinge/icl-calc/releases/tag/v${version}`;
      }
      const built = document.querySelector<HTMLAnchorElement>(
        'footer a[href*="/commit/"]'
      );
      if (built) {
        built.textContent = `(${commit})`;
        built.href = `https://github.com/ruipinge/icl-calc/commit/${commit}`;
      }
    },
    [PINNED_VERSION, PINNED_COMMIT]
  );
};

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
  await pinBuildStamp(page);
};

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name} looks right`, async ({ page }) => {
        await open(page, route.tab);

        await expect(page).toHaveScreenshot(
          `${route.name}-${viewport.name}.png`,
          { fullPage: true }
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
        `shell-footer-${viewport.name}.png`
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
