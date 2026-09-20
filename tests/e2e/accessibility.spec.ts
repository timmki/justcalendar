import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

test('controls have names, visible focus, and status announcements', async ({ page }) => {
  await configurePage(page);
  await page.goto('/');
  const settings = page.getByRole('button', { name: 'Settings', exact: true });
  const filters = page.getByRole('button', { name: 'Filters', exact: true });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(filters).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Public ICS URL')).toBeHidden();
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('From')).toBeVisible();
  await expect(page.getByLabel('To')).toBeVisible();
  await expect(page.getByLabel('Search')).toBeVisible();
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(filters).toBeFocused();
  await expect(page.getByLabel('Search')).toBeHidden();
  await filters.click();
  await page.keyboard.press('Escape');
  await expect(filters).toBeFocused();
  await expect(page.getByLabel('Search')).toBeHidden();
  await settings.click();
  await expect(page.getByLabel('Public ICS URL')).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await expect(settings).toHaveCSS('outline-style', 'solid');
});
