import { expect, test } from '@playwright/test';
import { configurePage } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

const largeFeed = `BEGIN:VCALENDAR\nVERSION:2.0\n${Array.from({ length: 5000 }, (_, index) => `BEGIN:VEVENT\nUID:event-${index}\nDTSTART:20260920T090000Z\nSUMMARY:Performance event ${index}\nEND:VEVENT`).join('\n')}\nEND:VCALENDAR`;

test('filters 5,000 occurrences within two seconds', async ({ page }) => {
  await configurePage(page, { feed: largeFeed });
  await page.goto('/');
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
  await page.getByLabel('Search').fill('Default');
  await page.waitForTimeout(50);
  const vitals = await page.evaluate(() => (window as Window & { __justCalendarVitals?: { lcp: number; inp: number; cls: number } }).__justCalendarVitals);
  expect(vitals?.lcp).toBeGreaterThan(0);
  expect(vitals?.lcp).toBeLessThanOrEqual(2500);
  expect(vitals?.inp ?? 0).toBeLessThanOrEqual(200);
  expect(vitals?.cls ?? 0).toBeLessThanOrEqual(0.1);
});
