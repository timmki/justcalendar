import type { Page } from '@playwright/test';

export const defaultUrl = 'https://calendar.example.test/default.ics';
export const replacementUrl = 'https://calendar.example.test/replacement.ics';

export function utcDateAtOffset(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export function icsDay(date: string): string {
  return date.replaceAll('-', '');
}

export function localDateAtOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const defaultDate = utcDateAtOffset(2);
export const replacementDate = utcDateAtOffset(3);
export const defaultFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:default\nDTSTART:${icsDay(defaultDate)}T090000Z\nDTEND:${icsDay(defaultDate)}T100000Z\nSUMMARY:Default event\nLOCATION:Room A\nDESCRIPTION:Default description\nEND:VEVENT\nEND:VCALENDAR`;
export const replacementFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:replacement\nDTSTART:${icsDay(replacementDate)}T090000Z\nDTEND:${icsDay(replacementDate)}T100000Z\nSUMMARY:Replacement event\nLOCATION:Room B\nEND:VEVENT\nEND:VCALENDAR`;

const logoPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

export async function configureLogo(page: Page, options: { png?: boolean; jpg?: boolean } = {}): Promise<void> {
  await page.route('**/logo.png', (route) => options.png
    ? route.fulfill({ status: 200, contentType: 'image/png', body: logoPng })
    : route.fulfill({ status: 404, body: '' }));
  await page.route('**/logo.jpg', (route) => options.jpg
    ? route.fulfill({ status: 200, contentType: 'image/jpeg', body: logoPng })
    : route.fulfill({ status: 404, body: '' }));
}

export async function configurePage(page: Page, options: { defaultUrl?: string | null; feed?: string; title?: string | null; subtitle?: string | null } = {}): Promise<void> {
  await page.route('**/config.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      schemaVersion: 1,
      defaultFeedUrl: options.defaultUrl === undefined ? defaultUrl : options.defaultUrl,
      telemetryEndpoint: null,
      ...(options.title === undefined ? {} : { title: options.title }),
      ...(options.subtitle === undefined ? {} : { subtitle: options.subtitle }),
    }),
  }));
  await page.route('**/api/v1/ics', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { url?: string };
    const feed = body.url === replacementUrl ? replacementFeed : options.feed ?? defaultFeed;
    await route.fulfill({ status: 200, contentType: 'text/calendar', body: feed });
  });
}
