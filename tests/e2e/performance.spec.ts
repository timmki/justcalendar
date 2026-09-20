import { expect, test } from '@playwright/test';
import { configurePage, icsDay, utcDateAtOffset } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

const largeFeed = `BEGIN:VCALENDAR\nVERSION:2.0\n${Array.from({ length: 5000 }, (_, index) => `BEGIN:VEVENT\nUID:event-${index}\nDTSTART:${icsDay(utcDateAtOffset(2))}T090000Z\nSUMMARY:Performance event ${index}\nEND:VEVENT`).join('\n')}\nEND:VCALENDAR`;

test('keeps events before secondary panels and avoids horizontal overflow', async ({ page }) => {
  await configurePage(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
  expect(await page.locator('.events').evaluate((events) => {
    const status = document.querySelector('.status-panel');
    return Boolean(status && events.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('filters 5,000 occurrences within two seconds', async ({ page }) => {
  test.setTimeout(120_000);
  await configurePage(page, { feed: largeFeed });
  await page.goto('/');
  await expect(page.getByText('Performance event 99')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
  const elapsed = await page.evaluate(async () => {
    const started = performance.now();
    const input = document.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'Performance event 4999';
    input.form?.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return performance.now() - started;
  });
  expect(elapsed).toBeLessThan(2000);
});

test('meets real render, interaction, and layout budgets', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { lcp: 0, inp: 0, cls: 0 };
    (window as Window & { __justCalendarVitals?: typeof state }).__justCalendarVitals = state;
    if (!PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) return;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) state.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes('event')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) state.inp = Math.max(state.inp, entry.duration);
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    }
  });
  await configurePage(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
  await page.getByLabel('Suche').fill('Default');
  await page.waitForTimeout(50);
  const vitals = await page.evaluate(() => (window as Window & { __justCalendarVitals?: { lcp: number; inp: number; cls: number } }).__justCalendarVitals);
  expect(vitals?.lcp).toBeGreaterThan(0);
  expect(vitals?.lcp).toBeLessThanOrEqual(2500);
  expect(vitals?.inp ?? 0).toBeLessThanOrEqual(200);
  expect(vitals?.cls ?? 0).toBeLessThanOrEqual(0.1);
});
