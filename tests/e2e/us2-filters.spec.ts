import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

const filterFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:first\nDTSTART:20260920T090000Z\nSUMMARY:Planning meeting\nLOCATION:Room A\nEND:VEVENT\nBEGIN:VEVENT\nUID:second\nDTSTART:20260922T090000Z\nSUMMARY:Release review\nLOCATION:Room B\nEND:VEVENT\nEND:VCALENDAR`;

test.describe('US2 filters', () => {
  test('filters by date and text, survives reload, and clears', async ({ page }) => {
    await configurePage(page, { feed: filterFeed });
    await page.goto('/');
    await expect(page.getByText('Planning meeting')).toBeVisible();
    await expect(page.getByText('Release review')).toBeVisible();
    const filters = page.getByRole('button', { name: 'Filters' });
    await expect(page.getByLabel('From')).toBeHidden();
    await filters.click();
    await page.getByLabel('From').fill('2026-09-22');
    await page.getByLabel('To').fill('2026-09-22');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.getByText('Release review')).toBeVisible();
    await expect(page.getByText('Planning meeting')).not.toBeVisible();
    await expect(page).toHaveURL(/from=2026-09-22/);
    await page.reload();
    await expect(page.getByText('Release review')).toBeVisible();
    await page.getByRole('button', { name: 'Filters (active)' }).click();
    await page.getByLabel('Search').fill('Room B');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.getByText('Release review')).toBeVisible();
    await expect(page.getByText('Planning meeting')).not.toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText('Planning meeting')).toBeVisible();
    await expect(page.getByLabel('Search')).toBeHidden();
  });
});
