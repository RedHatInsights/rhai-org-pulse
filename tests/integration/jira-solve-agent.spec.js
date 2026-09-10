const { test, expect } = require('@playwright/test');
const { setupErrorTracking, logCapturedErrors } = require('./helpers');

test.describe('Jira Solve Agent @jira-solve-agent', () => {
  test.beforeEach(async ({ page }) => setupErrorTracking(page));
  test.afterEach(async ({ page }, testInfo) => logCapturedErrors(page, testInfo));

  test('renders Agentic CVE metrics from demo data', async ({ page }) => {
    await page.goto('/#/jira-solve-agent/cve');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Agentic CVE' })).toBeVisible();
    await expect(page.getByText('Issues analyzed')).toBeVisible();
    await expect(page.getByText('Agentic PRs', { exact: true })).toBeVisible();
    await expect(page.getByText('Metadata issues')).toBeVisible();
    await expect(page.getByText('False positives addressed')).toBeVisible();
    await expect(page.getByText('OCPBUGS-90001')).toBeVisible();
    expect(page.errors).toHaveLength(0);
  });
});
