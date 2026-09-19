import { expect, test } from '@playwright/test';
import { configurePage, defaultUrl, replacementUrl } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

test.describe('US1 feed view', () => {
  test('loads events and exposes their details', async ({ page }) => {
    await configurePage(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Upcoming events' })).toBeVisible();
    await expect(page.getByText('Default event')).toBeVisible();
    await page.getByText('Default event').click();
    await expect(page.getByText('Location: Room A')).toBeVisible();
  });

  test('replaces and resets the active URL', async ({ page }) => {
    await configurePage(page);
    await page.goto('/');
    await page.getByLabel('Public ICS URL').fill(replacementUrl);
    await page.getByRole('button', { name: 'Use this calendar' }).click();
    await expect(page.getByText('Replacement event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset deployment URL' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset deployment URL' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
    await expect(page.getByLabel('Public ICS URL')).toHaveValue(defaultUrl);
  });

  test('supports recovery when deployment configuration is empty', async ({ page }) => {
    await configurePage(page, { defaultUrl: null });
    await page.goto('/');
    await expect(page.getByText('No deployment calendar URL is configured.')).toBeVisible();
    await page.getByLabel('Public ICS URL').fill(defaultUrl);
    await page.getByRole('button', { name: 'Use this calendar' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
  });

  test('retries unavailable deployment configuration', async ({ page }) => {
    let available = false;
    await configurePage(page, { defaultUrl: null });
    await page.unroute('**/config.json');
    await page.route('**/config.json', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ schemaVersion: 1, defaultFeedUrl: available ? defaultUrl : null, telemetryEndpoint: null }),
    }));
    await page.goto('/');
    await expect(page.getByText('No deployment calendar URL is configured.')).toBeVisible();
    available = true;
    await page.getByRole('button', { name: 'Refresh calendar' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
  });

  test('shows a retryable proxy error and recovers', async ({ page }) => {
    await configurePage(page);
    await page.unroute('**/api/v1/ics');
    await page.route('**/api/v1/ics', (route) => route.fulfill({
      status: 504,
      contentType: 'application/problem+json',
      body: JSON.stringify({ schemaVersion: 1, title: 'Calendar feed unavailable' }),
    }));
    await page.goto('/');
    await expect(page.getByText('Calendar feed unavailable')).toBeVisible();
    await page.unroute('**/api/v1/ics');
    await page.route('**/api/v1/ics', (route) => route.fulfill({ status: 200, contentType: 'text/calendar', body: `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:retry\nDTSTART:20260920T090000Z\nSUMMARY:Recovered event\nEND:VEVENT\nEND:VCALENDAR` }));
    await page.getByRole('button', { name: 'Refresh calendar' }).click();
    await expect(page.getByText('Recovered event')).toBeVisible();
  });
});
