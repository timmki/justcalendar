import { expect, test } from '@playwright/test';
import { configureLogo, configurePage, defaultUrl, icsDay, localDateAtOffset, replacementUrl, utcDateAtOffset } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

test.describe('US1 feed view', () => {
  test('loads events and exposes their details', async ({ page }) => {
    await configurePage(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('heading', { name: 'Kommende Termine' })).toBeVisible();
    await expect(page.locator('.event-card')).toHaveCount(1);
    await expect(page.getByText('Details anzeigen')).toBeVisible();
    await page.getByText('Default event').click();
    await expect(page.getByText('Details ausblenden')).toBeVisible();
    const mapLink = page.getByRole('link', { name: 'Ort Room A in Google Maps öffnen' });
    await expect(mapLink).toBeVisible();
    await expect(mapLink).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=Room%20A');
    await expect(mapLink).toHaveAttribute('target', '_blank');
    await expect(mapLink).toHaveAttribute('rel', 'noreferrer noopener');
  });

  test('mutes completed events while keeping them expandable', async ({ page }) => {
    const pastStart = localDateAtOffset(-3);
    const pastEnd = localDateAtOffset(-2);
    const currentStart = localDateAtOffset(0);
    const futureStart = localDateAtOffset(2);
    const feed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:past\nDTSTART;VALUE=DATE:${icsDay(pastStart)}\nDTEND;VALUE=DATE:${icsDay(pastEnd)}\nSUMMARY:Past event\nLOCATION:Past Room\nEND:VEVENT\nBEGIN:VEVENT\nUID:current\nDTSTART;VALUE=DATE:${icsDay(currentStart)}\nDTEND;VALUE=DATE:${icsDay(localDateAtOffset(1))}\nSUMMARY:Current event\nEND:VEVENT\nBEGIN:VEVENT\nUID:future\nDTSTART;VALUE=DATE:${icsDay(futureStart)}\nSUMMARY:Future event\nEND:VEVENT\nEND:VCALENDAR`;
    await configurePage(page, { feed });
    await page.goto('/');
    await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
    await page.getByLabel('Von').fill(pastStart);
    await page.getByLabel('Bis').fill(futureStart);
    await page.getByRole('button', { name: 'Filter anwenden' }).click();
    await expect(page.locator('.event-card.is-past')).toHaveCount(1);
    await expect(page.getByText('Vergangen')).toBeVisible();
    await expect(page.getByText('Current event')).toBeVisible();
    await expect(page.getByText('Future event')).toBeVisible();
    await page.locator('.event-card.is-past summary').press('Enter');
    await expect(page.getByRole('link', { name: 'Ort Past Room in Google Maps öffnen' })).toBeVisible();
  });

  test('uses a provided PNG logo and blue theme surfaces', async ({ page }) => {
    await configurePage(page);
    await configureLogo(page, { png: true });
    await page.goto('/');
    await expect(page.locator('img.brand-logo')).toBeVisible();
    await expect(page.locator('img.brand-logo')).toHaveAttribute('alt', '');
    await expect(page.locator('.event-card')).toHaveCSS('border-left-color', 'rgb(63, 135, 189)');
    await expect(page.locator('.status-panel button')).toHaveCSS('background-color', 'rgb(138, 197, 239)');
  });

  test('falls back to JPG and then the calendar emoji', async ({ page }) => {
    await configurePage(page);
    await configureLogo(page, { jpg: true });
    await page.goto('/');
    await expect(page.locator('img.brand-logo')).toBeVisible();

    await page.unroute('**/logo.png');
    await page.unroute('**/logo.jpg');
    await configureLogo(page);
    await page.reload();
    await expect(page.locator('img.brand-logo')).toBeHidden();
    await expect(page.locator('.brand-logo-fallback')).toHaveText('📅');
    await expect(page.locator('.brand-logo-fallback')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kommende Termine' })).toBeVisible();
  });

  test('replaces and resets the active URL', async ({ page }) => {
    await configurePage(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Einstellungen' }).click();
    await page.getByLabel('Öffentliche ICS-URL').fill(replacementUrl);
    await page.getByRole('button', { name: 'Diesen Kalender verwenden' }).click();
    await expect(page.getByText('Replacement event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Einstellungen' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Bereitstellungs-URL zurücksetzen' })).toBeVisible();
    await page.getByRole('button', { name: 'Bereitstellungs-URL zurücksetzen' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
    await expect(page.getByLabel('Öffentliche ICS-URL')).toHaveValue(defaultUrl);
  });

  test('supports recovery when deployment configuration is empty', async ({ page }) => {
    await configurePage(page, { defaultUrl: null });
    await page.goto('/');
    await page.getByRole('button', { name: 'Einstellungen' }).click();
    await expect(page.getByText('Es ist keine Kalender-URL für diese Bereitstellung konfiguriert.')).toBeVisible();
    await page.getByLabel('Öffentliche ICS-URL').fill(defaultUrl);
    await page.getByRole('button', { name: 'Diesen Kalender verwenden' }).click();
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
    await expect(page.getByText('Es ist keine Kalender-URL für diese Bereitstellung konfiguriert.')).toBeVisible();
    await page.getByRole('button', { name: 'Einstellungen' }).click();
    available = true;
    await page.getByRole('button', { name: 'Kalender aktualisieren' }).click();
    await expect(page.getByText('Default event')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Einstellungen' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: 'Kalender aktualisieren' })).toBeFocused();
  });

  test('shows a retryable proxy error and recovers', async ({ page }) => {
    await configurePage(page);
    await page.unroute('**/api/v1/ics');
    await page.route('**/api/v1/ics', (route) => route.fulfill({
      status: 504,
      contentType: 'application/problem+json',
      body: JSON.stringify({ schemaVersion: 1, title: 'Der Kalender-Feed ist nicht verfügbar.' }),
    }));
    await page.goto('/');
    await expect(page.getByText('Der Kalender-Feed ist nicht verfügbar.')).toBeVisible();
    await page.unroute('**/api/v1/ics');
    await page.route('**/api/v1/ics', (route) => route.fulfill({ status: 200, contentType: 'text/calendar', body: `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:retry\nDTSTART:${icsDay(utcDateAtOffset(2))}T090000Z\nSUMMARY:Recovered event\nEND:VEVENT\nEND:VCALENDAR` }));
    await page.getByRole('button', { name: 'Kalender aktualisieren' }).click();
    await expect(page.getByText('Recovered event')).toBeVisible();
  });
});
