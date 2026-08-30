import { expect, test } from '@playwright/test';

test('the frozen oracle loads and renders the patient form', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('input[name="biometry.ata"]')).toBeVisible();
  await expect(page.locator('input[name="iclSphericalEquivalent"]')).toBeVisible();
  // All four tabs present.
  await expect(page.locator('a.nav-link')).toHaveCount(4);
});
