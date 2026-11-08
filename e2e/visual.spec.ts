import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
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
 * The narrowest phone the form is laid out for, below the mobile viewport
 * above. Pinned at 360px with one reading's value and axis both invalid, so
 * the shot holds a keratometry row at its tightest and both its messages,
 * K first, each across the whole row (#195).
 */
test.describe('narrow (360x780)', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('patient with a keratometry reading in error looks right', async ({
    page
  }) => {
    await open(page, null);
    for (const [name, value] of [
      ['KAntFlt (dpt @ °), Anterior Keratometry Flat, dioptres', '99'],
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
      ['AtA (mm), Angle to Angle, millimetres', '12'],
      ['WtW (mm), White to White, millimetres', '15'],
      ['CLR (μm), Crystalline Lens Rise, micrometres', '300'],
      ['ACD (mm), Internal Anterior Chamber Depth, millimetres', '1'],
      ['ACAn (°), Anterior Chamber Angle nasal, degrees', '40'],
      ['ACAt (°), Anterior Chamber Angle temporal, degrees', '40']
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
 * The longer values - a third decimal of keratometry, a decimal axis - are
 * held by the #192/#195 check below, which sizes the tracks for them.
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
for (const width of [320, 360, 390, 800, 1280]) {
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
 * #192 and #195. Each field's unit is in its label - a keratometry row's
 * label carries its axis's too, "KAntFlt (dpt @ °)" - so every value track
 * holds the value alone. The tracks are sized to the longest valid values,
 * a width a font or track change could silently make too small. So, at
 * every width the form is checked at, with the longest value each field
 * accepts typed in (three decimals where a biometer reports them - K in
 * eighths of a dioptre - one decimal for an axis, as the ICL axis output is
 * rounded, and whole micrometres for CLR):
 *   - no value is clipped (the input does not scroll its own text);
 *   - no label or caption overflows its track or reaches its control;
 *   - the page does not scroll sideways;
 *   - showing every message moves no input: no field jumps sideways or
 *     changes width when an error appears.
 */
const LONGEST_VALID: [name: string, value: string][] = [
  ['biometry.ata', '19.125'],
  ['biometry.wtw', '19.125'],
  ['biometry.clr', '-1000'],
  ['biometry.acd', '5.125'],
  ['biometry.acan', '69.25'],
  ['biometry.acat', '69.25'],
  ['corneaProfile.kaf', '54.125'],
  ['corneaProfile.axisaf', '179.5'],
  ['corneaProfile.kas', '54.125'],
  ['corneaProfile.axisas', '179.5'],
  ['corneaProfile.kpf', '7.125'],
  ['corneaProfile.axispf', '179.5'],
  ['corneaProfile.kps', '7.125'],
  ['corneaProfile.axisps', '179.5'],
  ['corneaProfile.cct', '700'],
  ['spectacleRefraction.sphere', '-24.125'],
  ['spectacleRefraction.cylindre', '-7.125'],
  ['spectacleRefraction.axis', '179.5'],
  ['spectacleRefraction.vertex', '14.125']
];

/* The four ICL Power outputs follow from the values above; none may clip. */
const OUTPUTS = [
  'iclSphere',
  'iclCylindre',
  'iclAxis',
  'iclSphericalEquivalent'
];

const inputBoxes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLInputElement>('.mrow > input')].map(
      (input) => {
        const box = input.getBoundingClientRect();
        return {
          name: input.name,
          value: input.value,
          left: box.left,
          width: box.width,
          clipped: input.scrollWidth > input.clientWidth
        };
      }
    )
  );

/* Each row's label - short name, unit and caption - against its track. */
const labelBoxes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLLabelElement>('.mrow > label')]
      .filter((label) => !label.classList.contains('kat'))
      .map((label) => {
        const control = label.nextElementSibling!.getBoundingClientRect();
        return {
          for: label.htmlFor,
          overflows: label.scrollWidth > label.clientWidth,
          clear: label.getBoundingClientRect().right <= control.left + 0.5
        };
      })
  );

/*
 * For each row showing a message, the space between the bottom of the row's
 * lowest content - a control's box, a label's text without its padding - and
 * the top of the message's box. A cell that kept its 0.6rem would push the
 * message down by it.
 */
const messageGaps = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.mrow-error')]
      .filter(
        (message) => !message.previousElementSibling!.matches('.mrow-error')
      )
      .map((message) => {
        const cells = [...message.parentElement!.children].filter(
          (cell) => !cell.matches('.mrow-error')
        );
        const bottom = Math.max(
          ...cells.map((cell) => {
            const box = cell.getBoundingClientRect();
            return cell.matches('label')
              ? box.bottom - parseFloat(getComputedStyle(cell).paddingBottom)
              : box.bottom;
          })
        );
        const marginTop = parseFloat(getComputedStyle(message).marginTop);
        return {
          for: message.querySelector('[id]')!.id,
          gap: message.getBoundingClientRect().top - marginTop - bottom
        };
      })
  );

test('Age sets its value right, as every measured value does', async ({
  page
}) => {
  await open(page, null);
  const align = (selector: string) =>
    page.locator(selector).evaluate((el) => getComputedStyle(el).textAlign);
  expect(await align('input[name="biometry.ata"]')).toBe('right');
  expect(await align('input[name="age"]')).toBe('right');
});

for (const width of [320, 360, 390, 800, 1280]) {
  test(`at ${width}px no value or label clips, and an error moves no field`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, null);
    for (const [name, value] of LONGEST_VALID) {
      await page.locator(`input[name="${name}"]`).fill(value);
    }

    const valid = await inputBoxes(page);
    expect(valid.map(({ name }) => name)).toEqual([
      ...LONGEST_VALID.map(([name]) => name),
      ...OUTPUTS
    ]);
    for (const box of valid) {
      expect(box.value, box.name).not.toBe('');
      expect(box, box.name).toMatchObject({ clipped: false });
    }
    const labels = await labelBoxes(page);
    // every labelled row, in order; a keratometry axis's "@" is not a row label
    const notAnAxis = LONGEST_VALID.map(([name]) => name).filter(
      (name) => !name.startsWith('corneaProfile.axis')
    );
    expect(labels.map((label) => label.for)).toEqual([
      ...notAnAxis.slice(0, 11).map((name) => `${name}field`),
      'corneaProfile.previousSurgery',
      ...notAnAxis.slice(11).map((name) => `${name}field`),
      ...OUTPUTS.map((name) => `${name}field`)
    ]);
    for (const label of labels) {
      expect(label, label.for).toMatchObject({ overflows: false, clear: true });
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);

    // every typed field invalid and touched: each shows its message
    for (const [name] of LONGEST_VALID) {
      const field = page.locator(`input[name="${name}"]`);
      await field.fill('9999');
      await field.blur();
      await expect(field).toHaveAttribute('aria-invalid', 'true');
    }
    const invalid = await inputBoxes(page);
    expect(
      invalid.map(({ name, left, width }) => ({ name, left, width }))
    ).toEqual(valid.map(({ name, left, width }) => ({ name, left, width })));
    // each message hangs just under its row, with no cell's padding between
    const gaps = await messageGaps(page);
    expect(gaps).toHaveLength(LONGEST_VALID.length - 4);
    for (const { for: id, gap } of gaps) {
      expect(Math.abs(gap), id).toBeLessThan(1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);
  });
}

/*
 * #205, #206. The header holds the logo, the tool name and the Examples and
 * Reset buttons at every width the form is checked at: the page does not
 * scroll sideways, every header control is inside the viewport and a full
 * 44px target, and the open examples panel - every case in it a 44px target
 * - stays inside the viewport too.
 */
for (const width of [320, 360, 390, 800, 1280]) {
  test(`at ${width}px the header and its examples panel fit`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, null);
    const boxes = (selector: string) =>
      page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return {
            text: element.getAttribute('aria-label') ?? element.textContent,
            left: box.left,
            right: box.right,
            height: box.height
          };
        })
      );
    const inside = (box: { left: number; right: number }) =>
      box.left >= 0 && box.right <= width;

    const controls = await boxes('nav a, nav button');
    expect(controls.map((box) => box.text)).toEqual([
      'Treeye',
      'ICL Size Calc',
      'Examples',
      'Reset'
    ]);
    for (const box of controls) {
      expect(inside(box), box.text ?? '').toBe(true);
    }
    for (const box of controls.slice(2)) {
      expect(box.height, box.text ?? '').toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);

    await page.getByRole('button', { name: 'Examples' }).click();
    const [panel] = await boxes('#examples-panel');
    expect(inside(panel)).toBe(true);
    const items = await boxes('#examples-panel button');
    expect(items).toHaveLength(6);
    for (const item of items) {
      expect(inside(item), item.text ?? '').toBe(true);
      expect(item.height, item.text ?? '').toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBe(width);
  });
}

/*
 * #206. On a short screen - a phone held sideways, or a desktop at 400% zoom
 * - the panel, which hangs from the sticky header, ends inside the viewport
 * and scrolls itself, so the last case can still be reached.
 */
for (const viewport of [
  { width: 320, height: 480 },
  { width: 844, height: 390 },
  { width: 320, height: 256 }
]) {
  test(`at ${viewport.width}x${viewport.height} every example case can be reached`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await open(page, null);
    await page.getByRole('button', { name: 'Examples' }).click();
    const panel = page.locator('#examples-panel');
    const last = panel.getByRole('button').last();
    // scrolled as a person would, with the wheel over the panel
    await panel.hover();
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(() =>
        last.evaluate((element) => element.getBoundingClientRect().bottom)
      )
      .toBeLessThanOrEqual(viewport.height);
  });
}

/*
 * #206. A case loaded from far down a tab is confirmed where the clinician
 * can see it: the confirmation is scrolled into view, below the sticky
 * header, at a phone's and a desktop's width.
 */
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 600 }
]) {
  test(`at ${viewport.width}px a case loaded from down the page is confirmed in view`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await open(page, null);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    // Clicked in the page, not through Playwright's click: that scrolls the
    // target into view first, and for anything in the sticky header that
    // scrolls the page back to the top, hiding the case under test.
    const click = (locator: Locator) =>
      locator.evaluate((element: HTMLElement) => element.click());
    await click(page.getByRole('button', { name: 'Examples' }));
    // the case under test: the confirmation's place is scrolled out of view
    expect(
      await page
        .getByRole('status')
        .evaluate((element) => element.getBoundingClientRect().top)
    ).toBeLessThan(0);
    await click(page.locator('#examples-panel').getByRole('button').first());
    const status = page.getByRole('status');
    await expect(status).toContainText('Loaded');
    const header = await page
      .locator('nav')
      .evaluate((element) => element.getBoundingClientRect().bottom);
    const box = await status.evaluate((element) => ({
      top: element.getBoundingClientRect().top
    }));
    expect(box.top).toBeGreaterThanOrEqual(header);
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

for (const width of [320, 360, 390, 800, 1280]) {
  test(`at ${width}px the footer's full stop stays on the line of "Rui Pinge"`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 780 });
    await open(page, null);
    const link = page.locator('.site-footer a', { hasText: 'Rui Pinge' });
    await expect(link).toHaveCount(1);
    const found = await link.evaluate((a) => {
      const stop = a.nextSibling;
      if (stop === null || stop.nodeType !== Node.TEXT_NODE) {
        return null;
      }
      const range = document.createRange();
      range.selectNodeContents(stop);
      const dot = range.getBoundingClientRect();
      const box = a.getBoundingClientRect();
      return {
        text: stop.textContent,
        mid: (dot.top + dot.bottom) / 2,
        top: box.top,
        bottom: box.bottom
      };
    });
    // present, so the check below cannot pass vacuously
    expect(found).not.toBeNull();
    expect(found?.text).toBe('.');
    expect(found?.mid).toBeGreaterThanOrEqual(found?.top ?? Infinity);
    expect(found?.mid).toBeLessThanOrEqual(found?.bottom ?? -Infinity);
  });
}

/*
 * No histogram title clips its chart. SVG text never wraps, and the SVG is
 * exactly as wide as its column, so a title wider than the column was cut
 * off at both edges: "Internal Anterior Chamber Depth - ACD (mm)" is 334px
 * at 14px Poppins, against a 320px SVG at 360 and 280px at 320. A title too
 * wide breaks onto two lines and the chart moves down beneath it, so each
 * title must lie inside its SVG and above the plot's top gridline.
 */
for (const width of [320, 360, 390, 800, 1280]) {
  test(`at ${width}px every histogram title fits inside its chart`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, 'Biometric Normality');
    await page.evaluate(() => document.fonts.ready);
    const charts = await page
      .locator('[data-testid="histogram"]')
      .evaluateAll((svgs) =>
        svgs.map((svg) => {
          const box = svg.getBoundingClientRect();
          const title = svg.querySelector('[data-testid="histogram-title"]');
          const gridlines = [
            ...svg.querySelectorAll('[data-testid="gridline"]')
          ].map((line) => line.getBoundingClientRect().top);
          return {
            svg: { left: box.left, right: box.right },
            title:
              title === null
                ? null
                : {
                    text: title.textContent,
                    ...title.getBoundingClientRect().toJSON()
                  },
            topGridline: gridlines.length ? Math.min(...gridlines) : null
          };
        })
      );
    expect(charts).toHaveLength(6);
    for (const { svg, title, topGridline } of charts) {
      expect(title).not.toBeNull();
      expect(topGridline).not.toBeNull();
      const label = `${title?.text} at ${width}px`;
      expect(title?.left, label).toBeGreaterThanOrEqual(svg.left - 0.5);
      expect(title?.right, label).toBeLessThanOrEqual(svg.right + 0.5);
      expect(title?.bottom, label).toBeLessThanOrEqual(
        topGridline ?? -Infinity
      );
    }
  });
}

/*
 * No two x-axis labels on a histogram overlap. A chart labels bin 0 and
 * every k-th bin after it, k chosen from the widest label's estimated width;
 * this measures what the estimate is for. At 320px AtA's labels, 40px wide
 * at a 38.8px pitch, ran together as "11.28811.856" before it. Every chart
 * must be present and carry at least 3 labels, so the check cannot pass on
 * an empty page, and no tolerance is given in the labels' favour. The first
 * and last labels must also sit inside the SVG, or they would be clipped.
 */
for (const width of [320, 360, 390, 800, 1280]) {
  test(`at ${width}px no two histogram x-axis labels overlap`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, 'Biometric Normality');
    await page.evaluate(() => document.fonts.ready);
    const charts = await page
      .locator('[data-testid="histogram"]')
      .evaluateAll((svgs) =>
        svgs.map((svg) => ({
          title: svg.getAttribute('aria-label'),
          svgLeft: svg.getBoundingClientRect().left,
          svgRight: svg.getBoundingClientRect().right,
          ticks: [...svg.querySelectorAll('[data-testid="x-tick"]')].map(
            (tick) => {
              const box = tick.getBoundingClientRect();
              return {
                text: tick.textContent,
                left: box.left,
                right: box.right
              };
            }
          )
        }))
      );
    expect(charts).toHaveLength(6);
    for (const { title, svgLeft, svgRight, ticks } of charts) {
      expect(ticks.length, `${title} at ${width}px`).toBeGreaterThanOrEqual(3);
      expect(
        ticks[0].left,
        `${title} at ${width}px: first label "${ticks[0].text}" inside the chart`
      ).toBeGreaterThanOrEqual(svgLeft);
      expect(
        ticks[ticks.length - 1].right,
        `${title} at ${width}px: last label "${ticks[ticks.length - 1].text}" inside the chart`
      ).toBeLessThanOrEqual(svgRight);
      for (let i = 1; i < ticks.length; i++) {
        const prev = ticks[i - 1];
        const next = ticks[i];
        expect(
          next.left,
          `${title} at ${width}px: "${prev.text}" then "${next.text}"`
        ).toBeGreaterThanOrEqual(prev.right);
      }
    }
  });
}
