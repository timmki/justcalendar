import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

test('controls have names, visible focus, and status announcements', async ({ page }) => {
  await configurePage(page);
  await page.goto('/');
  await expect(page.getByLabel('Public ICS URL')).toBeVisible();
  await expect(page.getByLabel('From')).toBeVisible();
  await expect(page.getByLabel('To')).toBeVisible();
  await expect(page.getByLabel('Search')).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Public ICS URL')).toBeFocused();
  await page.getByLabel('Search').focus();
  await expect(page.getByLabel('Search')).toHaveCSS('outline-style', 'solid');
});
