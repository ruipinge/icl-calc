import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoTab, openApp } from './lib/app';

/**
 * A colour-contrast report for every route, at both viewports (#173).
 *
 * axe-core's `color-contrast` rule measures the rendered foreground against
 * the rendered background of every text node, which is what the legibility
 * tokens are meant to satisfy. It is the only automated check that would
 * notice a later reskin step quietly lowering a label below the threshold.
 *
 * It is a REPORT, not a gate: the CI job that runs it is `continue-on-error`
 * and is not a required check. The assertion still fails honestly, so a red
 * run names the offending nodes; it just does not block a merge.
 *
 * ROUTES and VIEWPORTS mirror visual.spec.ts rather than importing it. Those
 * constants are not exported, and importing a spec file registers its tests in
 * this one; moving them to a shared module would mean restructuring a guarded
 * spec for no gain. If either list changes there, change it here.
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

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name} has no colour-contrast violations`, async ({
        page
      }, testInfo) => {
        await openApp(page);
        if (route.tab !== null) {
          await gotoTab(page, route.tab);
        }

        const { violations } = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze();

        await testInfo.attach(`contrast-${route.name}-${viewport.name}.json`, {
          body: JSON.stringify(violations, null, 2),
          contentType: 'application/json'
        });

        // Summarised so a red run names the nodes and the measured ratio
        // instead of printing axe's full result objects.
        const summary = violations.flatMap((v) =>
          v.nodes.map((n) => ({
            rule: v.id,
            target: n.target.join(' '),
            message: n.any[0]?.message ?? n.failureSummary ?? ''
          }))
        );
        expect(summary).toEqual([]);
      });
    }
  });
}
