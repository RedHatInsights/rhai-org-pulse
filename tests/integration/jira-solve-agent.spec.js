const { test, expect } = require('@playwright/test');
const { DEFAULT_PAGE_WAIT_TIME } = require('./constants');
const { setupErrorTracking, logCapturedErrors } = require('./helpers');

test.describe('Jira Solve Agent Module @jira-solve-agent', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  test('shows OCPBUGS candidate, attempt, and merge totals', async ({ page }) => {
    await page.goto('/#/jira-solve-agent/main');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    const ocpbugs = page.getByRole('button', { name: /OCPBUGS/ });
    await expect(ocpbugs).toBeVisible();
    const ocpbugsCard = ocpbugs.locator('..');
    await expect(ocpbugsCard).toContainText('2');
    await expect(ocpbugsCard).toContainText('total candidate');
    await expect(ocpbugsCard).toContainText('total attempts');
    await expect(ocpbugsCard).toContainText('total merges');

    const mergeLink = page.getByRole('link', { name: 'View OCPBUGS merges in Jira' });
    await expect(mergeLink).toHaveAttribute('target', '_blank');
    await expect(mergeLink).toHaveAttribute('href', /resolution%20IN/);

    await ocpbugs.click();
    await expect(page.getByText('OCPBUGS-1001')).toBeVisible();
    await expect(page.getByText('OCPBUGS-1002')).toBeVisible();
    await expect(page.getByText('TRT-1003')).not.toBeVisible();
    expect(page.errors).toHaveLength(0);
  });
});
