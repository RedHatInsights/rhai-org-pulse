const { test, expect } = require('@playwright/test');
const { DEFAULT_PAGE_WAIT_TIME } = require('./constants');
const { setupErrorTracking, logCapturedErrors, pageHasContent, pageLoadComplete, mainContentIsVisible, countDisabledNavItems } = require('./helpers');

/**
 * Integration tests for the Jira Solve Agent module
 *
 * These tests verify:
 * - Module loads and renders correctly
 * - Data fetching and display works
 * - Navigation within the module functions
 * - API integration is functional
 * - PRs from org-qualified repos (migtools/, oadp-rebasebot/) are returned
 *   by the /data endpoint and attributed to the oadp team — the flow the
 *   server's TEAM_REPOS flattening (org-aware repo entries) exists for.
 *
 * Note: Unlike unit tests, these tests do NOT mock API responses at the
 * browser level. All requests flow through to the Express backend running
 * in demo mode, which serves fixtures/jira-solve-agent/data.json through
 * the same /data route the production fetcher writes to.
 *
 * Tag: @jira-solve-agent
 * Usage: npx playwright test --grep @jira-solve-agent
 */

test.describe('Jira Solve Agent Module @jira-solve-agent', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  test('should be visible in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Find the Jira Solve Agent module in the sidebar
    const moduleNav = page.locator('aside nav').filter({ hasText: 'OpenShift Jira Solve Agent' });
    const count = await moduleNav.count();
    expect(count).toBeGreaterThan(0);

    // Verify the module link is visible and clickable
    const moduleLink = moduleNav.first();
    await expect(moduleLink).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  test('should navigate to Jira Solve Agent module when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // The module's single view renders inside the sidebar's sub-items
    // container (div.ml-4) once the section is expanded. Its button carries
    // the same accessible name as the section header, so scope the locator
    // to that container rather than matching by name alone.
    const viewButton = page.locator('aside nav div.ml-4 button').filter({ hasText: 'OpenShift Jira Solve Agent' });

    // Each test runs in a fresh browser context, so the sidebar starts
    // collapsed — expand the section first if the sub-item isn't rendered.
    if (!(await viewButton.count())) {
      const moduleHeader = page.locator('aside nav button').filter({ hasText: 'OpenShift Jira Solve Agent' }).first();
      await moduleHeader.click();
      await page.waitForTimeout(500);
    }
    await expect(viewButton).toBeVisible();
    await viewButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Verify URL changed to the jira-solve-agent module (only view is main)
    expect(page.url()).toMatch(/jira-solve-agent\/main/);

    // Verify main content is visible
    const mainContentVisible = await mainContentIsVisible(page);
    expect(mainContentVisible).toBe(true);

    expect(page.errors).toHaveLength(0);
  });

  test('should fetch data from Jira Solve Agent API endpoints', async ({ page }) => {
    // Monitor network requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/modules/jira-solve-agent')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // Navigate to the main view (makes the /data API call on mount)
    await page.goto('/#/jira-solve-agent/main');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Verify that API requests were made to the Jira Solve Agent endpoints
    expect(apiRequests.length).toBeGreaterThan(0);
    console.log(`Jira Solve Agent API requests: ${apiRequests.length}`);
    apiRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    // Verify at least one request is for the data endpoint (the only view)
    const dataRequest = apiRequests.find(req => req.url.includes('/data'));
    expect(dataRequest).toBeDefined();

    expect(page.errors).toHaveLength(0);
  });

  test('should return migtools PRs attributed to the oadp team', async ({ page }) => {
    // The /data endpoint returns the processed issue rows plus the
    // teamRepos map straight from the server's TEAM_REPOS. PRs opened by
    // the bot in org-qualified repos (migtools/*, oadp-rebasebot/*) must
    // come back tagged team: 'oadp' — that is the whole point of the
    // org-aware flattening in server/github/prs.js.
    const dataResponse = page.waitForResponse(
      response => response.url().includes('/api/modules/jira-solve-agent/data')
    );

    await page.goto('/#/jira-solve-agent/main');
    const response = await dataResponse;
    expect(response.status()).toBe(200);

    const payload = await response.json();

    // teamRepos carries the org-qualified repo entries verbatim
    expect(payload.teamRepos.oadp).toEqual(expect.arrayContaining([
      'migtools/kopia',
      'migtools/filebrowser',
      'oadp-rebasebot/oadp-rebase'
    ]));

    // migtools PR rows are returned and every one is attributed to oadp
    const migtoolsRows = payload.issues.filter(
      issue => (issue.prUrl || '').includes('github.com/migtools/')
    );
    expect(migtoolsRows.length).toBeGreaterThan(0);
    for (const row of migtoolsRows) {
      expect(row.team).toBe('oadp');
      expect(row.source).toBe('chai-bot-pr');
    }

    expect(page.errors).toHaveLength(0);
  });

  test('should keep migtools PR rows under the OADP team filter', async ({ page }) => {
    await page.goto('/#/jira-solve-agent/main');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Sanity: the demo data rendered a table with bot PR links
    const migtoolsLinks = page.locator('table a[href^="https://github.com/migtools/"]');
    await expect(migtoolsLinks.first()).toBeVisible();

    // The non-OADP row (an MCO issue) is present under All Teams
    await expect(page.locator('table tbody tr').filter({ hasText: 'MCO-2001' })).toHaveCount(1);

    // Switch to the OADP & Backup team filter
    await page.locator('button').filter({ hasText: 'OADP & Backup' }).first().click();
    await page.waitForTimeout(500);

    // migtools PR rows stay visible (team-attributed rows match the oadp team)
    await expect(migtoolsLinks.first()).toBeVisible();

    // The non-OADP row is filtered out
    await expect(page.locator('table tbody tr').filter({ hasText: 'MCO-2001' })).toHaveCount(0);

    expect(page.errors).toHaveLength(0);
  });
});

/**
 * Disabled Menu Items
 *
 * Verify that Jira Solve Agent module has no disabled menu items.
 * All navigation items should be active and clickable.
 */
test.describe('Jira Solve Agent Disabled Menu Items @jira-solve-agent', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  test('should have no disabled menu items', async ({ page }) => {
    await page.goto('/#/jira-solve-agent/main');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Count disabled navigation items within the Jira Solve Agent section only
    const disabledCount = await countDisabledNavItems(page, 'OpenShift Jira Solve Agent');

    // Jira Solve Agent module should have no disabled menu items
    expect(disabledCount).toBe(0);
    expect(page.errors).toHaveLength(0);
  });
});

/**
 * Active Components
 *
 * Verify the main view loads with meaningful content. These tests exercise
 * the demo mode backend, ensuring the /data route serves the fixture through
 * the same processing path as production data and renders without errors.
 */
test.describe('Jira Solve Agent Views @jira-solve-agent', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  test('should load main view', async ({ page }) => {
    await page.goto('/#/jira-solve-agent/main');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Before we verify content, we need to verify the overall view loads
    const mainContentVisible = await mainContentIsVisible(page);
    expect(mainContentVisible).toBe(true);

    // Verify the view has rendered some meaningful content by checking for
    // data-bearing elements (not just empty containers or placeholders)
    const hasContent = await pageHasContent(page);
    expect(hasContent).toBe(true);

    // The demo fixture renders a populated issues table, not the empty state
    const tableRows = await page.locator('table tbody tr').count();
    expect(tableRows).toBeGreaterThan(0);

    // Verify we're not stuck in an infinite loading state
    const pageHasFinishedLoading = await pageLoadComplete(page);
    expect(pageHasFinishedLoading).toBe(true);
    if (page.errors.length > 0) {
      console.error('Main view errors:', page.errors);
    }

    expect(page.errors).toHaveLength(0);
  });
});
