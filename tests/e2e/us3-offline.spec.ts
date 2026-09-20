import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

async function primeOfflineShell(page: Parameters<typeof configurePage>[0]): Promise<void> {
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(async () => {
    const assets = ['/config.json', ...[...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"]')]
      .map((asset) => 'src' in asset ? asset.src : asset.href)];
    await Promise.all(assets.map((asset) => fetch(asset, { cache: 'no-store' })));
  });
}

test.describe('US3 offline snapshot', () => {
  test('opens the last snapshot offline and keeps filtering available', async ({ page, context }) => {
    await configurePage(page);
    await page.goto('/');
    await expect(page.getByText('Default event')).toBeVisible();
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByLabel('Public ICS URL').fill('https://calendar.example.test/default.ics');
    await page.getByRole('button', { name: 'Use this calendar' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
    await primeOfflineShell(page);
    expect(await page.evaluate(() => new Promise<boolean>((resolve) => {
      const request = indexedDB.open('justcalendar', 1);
      request.onsuccess = () => {
        const transaction = request.result.transaction('snapshots');
        const get = transaction.objectStore('snapshots').getAll();
        get.onsuccess = () => resolve(get.result.length > 0);
        get.onerror = () => resolve(false);
      };
      request.onerror = () => resolve(false);
    }))).toBe(true);
    await page.unroute('**/api/v1/ics');
    await context.setOffline(true);
    const started = Date.now();
    await page.reload();
    await expect(page.getByText(/Showing the last saved snapshot/)).toBeVisible();
    expect(Date.now() - started).toBeLessThan(5000);
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByLabel('Search').fill('Default');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
  });

  test('shows no-snapshot recovery offline', async ({ page, context }) => {
    await configurePage(page);
    await page.goto('/');
    await expect(page.getByText('Default event')).toBeVisible();
    await primeOfflineShell(page);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('justcalendar');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    });
    await page.unroute('**/api/v1/ics');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('No offline calendar is available yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh calendar' })).toBeVisible();
    expect(await page.locator('.events').evaluate((events) => Boolean(
      events.compareDocumentPosition(document.querySelector('.status-panel')!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ))).toBe(true);
  });
});
