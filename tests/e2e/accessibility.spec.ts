import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

test('controls have German names, visible focus, and status announcements', async ({ page }) => {
  await configurePage(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/icon.svg');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('crossorigin', 'use-credentials');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow, noarchive');
  await expect(page.locator('header p')).toHaveText('Mein Kalender');
  await expect(page.getByRole('heading', { name: 'Kommende Termine' })).toBeVisible();
  const settings = page.getByRole('button', { name: 'Einstellungen', exact: true });
  const filters = page.getByRole('button', { name: 'Filter (aktiv)', exact: true });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(filters).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Öffentliche ICS-URL')).toBeHidden();
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('Von')).toBeVisible();
  await expect(page.getByLabel('Bis')).toBeVisible();
  await expect(page.getByLabel('Suche')).toBeVisible();
  await page.getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(filters).toBeFocused();
  await expect(page.getByLabel('Suche')).toBeHidden();
  await filters.click();
  await page.keyboard.press('Escape');
  await expect(filters).toBeFocused();
  await expect(page.getByLabel('Suche')).toBeHidden();
  await settings.click();
  await expect(page.getByLabel('Öffentliche ICS-URL')).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await expect(settings).toHaveCSS('outline-style', 'solid');
});

test('uses configured German branding as plain text', async ({ page }) => {
  await configurePage(page, { title: '  Mein Kalender  ', subtitle: '  Termine heute  ' });
  await page.goto('/');
  await expect(page.locator('header p')).toHaveText('Termine heute');
  await expect(page.getByRole('heading', { name: 'Mein Kalender' })).toBeVisible();
  await expect(page).toHaveTitle('Mein Kalender');
  await expect(page.locator('header')).not.toContainText('<');
});

test('exposes event expansion through the keyboard', async ({ page }) => {
  await configurePage(page);
  await page.goto('/');
  const summary = page.locator('.event-card summary').first();
  await summary.focus();
  await expect(summary).toContainText('Details anzeigen');
  await page.keyboard.press('Enter');
  await expect(summary).toContainText('Details ausblenden');
});
