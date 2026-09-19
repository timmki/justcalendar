import type { Page } from '@playwright/test';

export const defaultUrl = 'https://calendar.example.test/default.ics';
export const replacementUrl = 'https://calendar.example.test/replacement.ics';

export const defaultFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:default\nDTSTART:20260920T090000Z\nDTEND:20260920T100000Z\nSUMMARY:Default event\nLOCATION:Room A\nDESCRIPTION:Default description\nEND:VEVENT\nEND:VCALENDAR`;
export const replacementFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:replacement\nDTSTART:20260921T090000Z\nDTEND:20260921T100000Z\nSUMMARY:Replacement event\nLOCATION:Room B\nEND:VEVENT\nEND:VCALENDAR`;

export async function configurePage(page: Page, options: { defaultUrl?: string | null; feed?: string } = {}): Promise<void> {
  await page.route('**/config.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ schemaVersion: 1, defaultFeedUrl: options.defaultUrl === undefined ? defaultUrl : options.defaultUrl, telemetryEndpoint: null }),
  }));
  await page.route('**/api/v1/ics', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { url?: string };
    const feed = body.url === replacementUrl ? replacementFeed : options.feed ?? defaultFeed;
    await route.fulfill({ status: 200, contentType: 'text/calendar', body: feed });
  });
}
