import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { fillRow, gotoTab, openApp } from './lib/app';

import type { GoldenRow } from '../src/golden/types';
import inputs from '../src/golden/inputs.json';

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

/*
 * Floating Matrix and Regression show a note naming what to enter, and no
 * table, until the inputs they compute from are present (#197). Their shots
 * enter golden row 01 first, so the tables stay under visual coverage; the
 * empty-state notes are pinned by their own tests below.
 */
const BASELINE = inputs.rows[0] as GoldenRow;
const FILLED_TABS: readonly string[] = ['Floating Matrix', 'Regression'];

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
 * This is the only DOM the visual tests rewrite, and it is deliberately
 * narrow: two anchors' text and href, nothing else. (The narrow patient
 * test below fills two inputs as a user would; it rewrites nothing.) Their
 * real content is asserted by src/misc/Footer.test.tsx, which is where it
 * belongs.
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
 * Patient and Biometric Normality are left at INITIAL_VALUES: an empty
 * patient with every measured field empty (#196). Floating Matrix and
 * Regression are opened with golden row 01 entered (see FILLED_TABS), since
 * an empty form shows them as a note. Both are deterministic - every rendered
 * number is derived from constants, src/data.csv or src/golden/inputs.json,
 * none of which change - and neither triggers validation styling (the one
 * exception, the narrow patient test, triggers it on purpose). The clock is
 * pinned by openApp regardless, because PatientInfo.age() reads Date.now().
 */
const open = async (
  page: Page,
  tab: string | null,
  filled: boolean = tab !== null && FILLED_TABS.includes(tab)
) => {
  await openApp(page);
  if (filled) {
    await fillRow(page, BASELINE);
  }
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

      // By role, not `.navbar`: that is a Bootstrap class #122 deletes.
      // The header is the only <nav> on any route, so the implicit
      // navigation role addresses it uniquely.
      await expect(page.getByRole('navigation')).toHaveScreenshot(
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
 * Under 24rem (384px) a keratometry reading's "@ Y º" wraps onto a second
 * line under its K value - a layout neither viewport above reaches, since
 * the mobile one is 390px. Pinned at 360px with one reading's value and axis
 * both invalid, so the shot holds the wrap and both messages under their own
 * controls.
 */
test.describe('narrow (360x780)', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('patient with a keratometry reading in error looks right', async ({
    page
  }) => {
    await open(page, null);
    for (const [name, value] of [
      ['Anterior Keratometry Flat (KAntFlt), dioptres', '99'],
      ['Anterior Keratometry Flat axis, degrees', '400']
    ]) {
      const field = page.getByRole('spinbutton', { name });
      await field.fill(value);
      await field.blur();
      await expect(field).toHaveAttribute('aria-invalid', 'true');
    }
    // filling scrolled the page; a full-page shot from there would paint the
    // sticky header over the form
    await page.evaluate(() => window.scrollTo(0, 0));

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(360);
    await expect(page).toHaveScreenshot('patient-error-narrow.png', {
      fullPage: true
    });
  });

  /*
   * At INITIAL_VALUES every gauge but one is out of range, so the routes
   * above show only "below the range" and "no value entered" under the
   * gauges (#194). Here they land in two inner bands, below the range and
   * above it, with Age still empty, so the shot holds each kind of caption
   * - a band, below, above, none - and the longest band name ("between the
   * 75th and 97.5th percentiles") at the narrowest width.
   */
  test('normality with measurements entered looks right', async ({ page }) => {
    await open(page, null);
    for (const [name, value] of [
      ['Angle to Angle (AtA), millimetres', '12'],
      ['White to White (WtW), millimetres', '15'],
      ['Crystaline Lens Rise (CLR), micrometres', '300'],
      ['Internal Anterior Chamber Depth (ACD), millimetres', '1'],
      ['Anterior Chamber Angle nasal (ACAn), degrees', '40'],
      ['Anterior Chamber Angle temporal (ACAt), degrees', '40']
    ]) {
      const field = page.getByRole('spinbutton', { name });
      await field.fill(value);
      await field.blur();
    }
    await gotoTab(page, 'Biometric Normality');
    await page.evaluate(() => window.scrollTo(0, 0));

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(360);
    await expect(page).toHaveScreenshot('normality-measured-narrow.png', {
      fullPage: true
    });
  });
});

/*
 * #193: no value is clipped by its input. Every field holds the longest value
 * at the precision a biometer reports it: keratometry to two decimals, axes
 * as whole degrees (all tabular digits are one width, so "180" stands for
 * every axis). Each input's text must fit inside it, at every viewport the
 * fixtures use plus the 800px tablet. A clipped "180" reads as "18".
 *
 * Not guaranteed, and an owner decision on #193: a third decimal of
 * keratometry ("43.125") or a decimal axis ("176.5") is wider than its
 * input; the decimal axis was already clipped in Newsreader.
 */
const LONG_VALUES: [name: string, value: string][] = [
  ['biometry.ata', '12.25'],
  ['biometry.wtw', '11.75'],
  ['biometry.clr', '-1000'],
  ['biometry.acd', '3.25'],
  ['biometry.acan', '45.5'],
  ['biometry.acat', '45.5'],
  ['corneaProfile.kaf', '43.25'],
  ['corneaProfile.kas', '44.75'],
  ['corneaProfile.kpf', '6.25'],
  ['corneaProfile.kps', '6.75'],
  ['corneaProfile.axisaf', '180'],
  ['corneaProfile.axisas', '180'],
  ['corneaProfile.cct', '700'],
  ['spectacleRefraction.sphere', '-12.75'],
  ['spectacleRefraction.cylindre', '-7.75'],
  ['spectacleRefraction.axis', '180'],
  ['spectacleRefraction.vertex', '12']
];
for (const width of [360, 390, 800, 1280]) {
  test.describe(`values at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('every patient value fits inside its input', async ({ page }) => {
      await open(page, null);
      await page.evaluate(() => document.fonts.ready);
      for (const [name, value] of LONG_VALUES) {
        await page.locator(`input[name="${name}"]`).fill(value);
      }
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll('input')]
          .filter((input) => input.scrollWidth > input.clientWidth)
          .map((input) => `${input.name}="${input.value}"`)
      );
      expect(clipped).toEqual([]);
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

/*
 * The Floating Matrix scrolls sideways under a sticky label column, and a lens
 * size that slides half under it reads as a different, real lens: "12.6 mm"
 * clipped to "2.6 mm". So a lens label is either whole - right of the sticky
 * column and inside the scroller - or not shown at all, at every scroll
 * position; and once scrolling settles, every lens group with any column in
 * view shows its label whole.
 *
 * Geometry, not pixels: each label's text box is measured against the
 * visible region - from the label column's right edge (or the scroller's
 * left edge, if that column has scrolled away) to the scroller's right edge.
 * "Not shown" means the text box is entirely outside that region, or its
 * colour is fully transparent.
 *
 * 360 and 390 are phones, where one lens group is in view at a time; 600 is
 * a small tablet; 800 sits between 48rem and 54rem, above the phone cap on
 * the label column, with two groups in view. The last three are scrollers
 * narrower than 17.5rem (a label column of 5rem plus one 12.5rem group): a
 * phone under 320px, a 360px phone at 125% zoom (288px), and a 360px phone
 * with a 20px root font, as a larger text setting gives.
 */
const MATRIX_SCROLL_VIEWPORTS: {
  width: number;
  height: number;
  rootFontPx?: number;
}[] = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 600, height: 900 },
  { width: 800, height: 900 },
  { width: 300, height: 640 },
  { width: 288, height: 640 },
  { width: 360, height: 780, rootFontPx: 20 }
];

/** Opens the matrix, with the root font size overridden if asked. */
const openMatrix = async (page: Page, rootFontPx?: number) => {
  await open(page, 'Floating Matrix');
  if (rootFontPx !== undefined) {
    await page.addStyleTag({
      content: `html { font-size: ${rootFontPx}px; }`
    });
    // a layout pass, so every measurement below sees the new size
    await page.evaluate(() => document.body.getBoundingClientRect());
  }
};

/*
 * LENS_SIZES.length in src/matrix/data.ts. Not imported: that module pulls
 * in the dataset. Asserted so a selector that matches nothing cannot pass.
 */
const LENS_GROUPS = 3;

/**
 * The rendered width of every lens group, and the width --ledger-group asks
 * for. Whole-group paging assumes they agree: content that widens a group
 * breaks it without failing any position the at-rest test happens to visit.
 */
const lensGroupWidths = (page: Page) =>
  page.evaluate(() => {
    const table = document.querySelector<HTMLElement>('.ledger-scroll table')!;
    const declared = getComputedStyle(table)
      .getPropertyValue('--ledger-group')
      .trim();
    const rootPx = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const expected = declared.endsWith('rem')
      ? parseFloat(declared) * rootPx
      : parseFloat(declared);
    const widths = Array.from(
      table.querySelectorAll<HTMLElement>('thead th[colspan]'),
      (th) => th.getBoundingClientRect().width
    );
    return { declared, expected, widths };
  });

const lensLabelCount = (page: Page) =>
  page.locator('.ledger-scroll thead th[colspan]').count();

/** Returns one line per lens label that breaks the rule; [] when none does. */
const lensLabelViolations = (page: Page, requireWhole: boolean) =>
  page.evaluate((requireWhole) => {
    // Sub-pixel slack for rounding in getBoundingClientRect.
    const EPS = 0.5;
    const scroller = document.querySelector<HTMLElement>('.ledger-scroll')!;
    const port = scroller.getBoundingClientRect();
    const portLeft = port.left + scroller.clientLeft;
    const portRight = portLeft + scroller.clientWidth;
    // The label column's right edge, or the scroller's left edge once that
    // column has scrolled out of view.
    const stickyRight = Math.max(
      portLeft,
      scroller.querySelector('thead th:first-child')!.getBoundingClientRect()
        .right
    );

    const out: string[] = [];
    for (const th of scroller.querySelectorAll<HTMLElement>(
      'thead th[colspan]'
    )) {
      const range = document.createRange();
      range.selectNodeContents(th);
      const text = range.getBoundingClientRect();
      const cell = th.getBoundingClientRect();
      const where =
        `"${th.textContent}" at scrollLeft=${scroller.scrollLeft}: text ` +
        `[${text.left.toFixed(1)}, ${text.right.toFixed(1)}], visible region ` +
        `[${stickyRight.toFixed(1)}, ${portRight.toFixed(1)}]`;

      const transparent = /^rgba\(.*,\s*0\)$|^transparent$/.test(
        getComputedStyle(th).color
      );
      const outside =
        text.right <= stickyRight + EPS || text.left >= portRight - EPS;
      const whole =
        text.left >= stickyRight - EPS && text.right <= portRight + EPS;

      if (!transparent && !outside && !whole) {
        out.push(`partly visible: ${where}`);
      }
      if (requireWhole) {
        const groupInView =
          Math.min(cell.right, portRight) - Math.max(cell.left, stickyRight) >
          EPS;
        if (groupInView && !(whole && !transparent)) {
          out.push(`group in view without its whole label: ${where}`);
        }
      }
    }
    return out;
  }, requireWhole);

/** Lets the scroll settle (snapping included) and scroll timelines catch up. */
const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const scroller = document.querySelector<HTMLElement>('.ledger-scroll')!;
        let last = -1;
        let still = 0;
        const tick = () => {
          still = scroller.scrollLeft === last ? still + 1 : 0;
          last = scroller.scrollLeft;
          if (still >= 3) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
  );

const scrollMatrixTo = async (page: Page, left: number) => {
  await page
    .locator('.ledger-scroll')
    .evaluate((el, x) => el.scrollTo({ left: x, behavior: 'instant' }), left);
  await settle(page);
};

const maxMatrixScroll = (page: Page) =>
  page
    .locator('.ledger-scroll')
    .evaluate((el) => el.scrollWidth - el.clientWidth);

for (const { rootFontPx, ...viewport } of MATRIX_SCROLL_VIEWPORTS) {
  const font =
    rootFontPx === undefined ? '' : ` with a ${rootFontPx}px root font`;
  test.describe(`matrix at ${viewport.width}x${viewport.height}${font}`, () => {
    test.use({ viewport });

    test('a lens label is whole for every group in view once scrolling settles', async ({
      page
    }) => {
      await openMatrix(page, rootFontPx);
      const max = await maxMatrixScroll(page);
      // Proves the case under test exists: the table really scrolls here.
      expect(max).toBeGreaterThan(0);
      expect(await lensLabelCount(page)).toBe(LENS_GROUPS);

      const groups = await lensGroupWidths(page);
      expect(
        groups.expected,
        `--ledger-group is "${groups.declared}"`
      ).toBeGreaterThan(0);
      for (const width of groups.widths) {
        expect(
          Math.abs(width - groups.expected),
          `a lens group is ${width}px wide, --ledger-group is ${groups.expected}px`
        ).toBeLessThanOrEqual(0.5);
      }

      for (const left of [
        0,
        20,
        60,
        Math.round(max / 4),
        Math.round(max / 2),
        Math.round((max * 3) / 4),
        max
      ]) {
        await scrollMatrixTo(page, left);
        expect(await lensLabelViolations(page, true)).toEqual([]);
      }
    });

    test('no lens label is ever partly visible mid-scroll', async ({
      page
    }) => {
      // up to four scroller-widths at 2px a step, about 30s at the widest
      test.setTimeout(120_000);
      await openMatrix(page, rootFontPx);
      // Snapping would carry every position below back to a resting one;
      // turned off, the sweep stands in for the frames of a scroll in flight.
      await page
        .locator('.ledger-scroll')
        .evaluate((el) => (el.style.scrollSnapType = 'none'));
      const max = await maxMatrixScroll(page);
      expect(max).toBeGreaterThan(0);
      expect(await lensLabelCount(page)).toBe(LENS_GROUPS);

      // Every 2px, so a stretch of 2px or more in which a label is partly
      // visible cannot fall between two samples.
      const violations: string[] = [];
      for (let left = 0; left <= max + 2; left += 2) {
        await scrollMatrixTo(page, Math.min(left, max));
        violations.push(...(await lensLabelViolations(page, false)));
      }
      expect(violations).toEqual([]);
    });
  });
}

/*
 * On an empty form the two computed tabs name what to enter instead of
 * showing numbers from missing inputs (#197). Inline: the note is the whole
 * of what changes, and the shell around it is pinned by the route fixtures.
 */
for (const { tab, note } of [
  {
    tab: 'Floating Matrix',
    note: 'Enter AtA and CLR on the Patient tab to see the matching eyes.'
  },
  {
    tab: 'Regression',
    note:
      'Enter Date of Birth, AtA, CLR, ACD, KAntFlt, KAntStp, CCT, Sphere, ' +
      'Cylindre and Vertex on the Patient tab to see the vault prediction ' +
      'and its probabilities.'
  }
]) {
  test(`${tab} on an empty form names what to enter, and shows no table`, async ({
    page
  }) => {
    await open(page, tab, false);
    await expect(page.getByText(note, { exact: true })).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
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
