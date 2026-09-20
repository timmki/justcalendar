import { expect, test } from '@playwright/test';
import { addCalendarMonthsClamped, formatLocalDate } from '../../src/date-range.js';
import { configurePage, icsDay, localDateAtOffset, utcDateAtOffset } from './fixtures.js';

test.use({ serviceWorkers: 'block' });

const today = formatLocalDate(new Date());
const defaultEnd = formatLocalDate(addCalendarMonthsClamped(new Date(), 2));
const outsideDefaultValue = new Date(`${defaultEnd}T12:00:00`);
outsideDefaultValue.setDate(outsideDefaultValue.getDate() + 1);
const outsideDefault = formatLocalDate(outsideDefaultValue);
const firstDate = utcDateAtOffset(2);
const secondDate = utcDateAtOffset(4);
const filterFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:first\nDTSTART:${icsDay(firstDate)}T090000Z\nSUMMARY:Planning meeting\nLOCATION:Room A\nEND:VEVENT\nBEGIN:VEVENT\nUID:second\nDTSTART:${icsDay(secondDate)}T090000Z\nSUMMARY:Release review\nLOCATION:Room B\nEND:VEVENT\nEND:VCALENDAR`;
const defaultRangeFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:past\nDTSTART;VALUE=DATE:${icsDay(localDateAtOffset(-7))}\nSUMMARY:Past event\nEND:VEVENT\nBEGIN:VEVENT\nUID:start\nDTSTART;VALUE=DATE:${icsDay(today)}\nSUMMARY:Start boundary\nEND:VEVENT\nBEGIN:VEVENT\nUID:end\nDTSTART;VALUE=DATE:${icsDay(defaultEnd)}\nSUMMARY:End boundary\nEND:VEVENT\nBEGIN:VEVENT\nUID:after\nDTSTART;VALUE=DATE:${icsDay(outsideDefault)}\nSUMMARY:Outside default\nEND:VEVENT\nEND:VCALENDAR`;

test.describe('US2 filters', () => {
  test('defaults to two calendar months with inclusive boundaries', async ({ page }) => {
    await configurePage(page, { feed: defaultRangeFeed });
    await page.goto('/');
    await expect(page.getByText('Start boundary')).toBeVisible();
    await expect(page.getByText('End boundary')).toBeVisible();
    await expect(page.getByText('Past event')).not.toBeVisible();
    await expect(page.getByText('Outside default')).not.toBeVisible();
    await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
    await expect(page.getByLabel('Von')).toHaveValue(today);
    await expect(page.getByLabel('Bis')).toHaveValue(defaultEnd);
  });

  test('filters by date and text, resets on reload, and resets in-session', async ({ page }) => {
    await configurePage(page, { feed: filterFeed });
    await page.goto('/');
    await expect(page.getByText('Planning meeting')).toBeVisible();
    await expect(page.getByText('Release review')).toBeVisible();
    const filters = page.getByRole('button', { name: 'Filter (aktiv)', exact: true });
    await expect(page.getByLabel('Von')).toBeHidden();
    await filters.click();
    await page.getByLabel('Von').fill(secondDate);
    await page.getByLabel('Bis').fill(secondDate);
    await page.getByRole('button', { name: 'Filter anwenden' }).click();
    await expect(page.getByText('Release review')).toBeVisible();
    await expect(page.getByText('Planning meeting')).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`from=${secondDate}`));
    await page.reload();
    await expect(page.getByText('Planning meeting')).toBeVisible();
    await expect(page.getByText('Release review')).toBeVisible();
    await expect(page).not.toHaveURL(/from=/);
    await page.getByRole('button', { name: 'Filter (aktiv)' }).click();
    await expect(page.getByLabel('Von')).toHaveValue(today);
    await expect(page.getByLabel('Bis')).toHaveValue(defaultEnd);
    await expect(page.getByLabel('Suche')).toHaveValue('');
    await page.getByLabel('Suche').fill('Room B');
    await page.getByRole('button', { name: 'Filter anwenden' }).click();
    await expect(page.getByText('Release review')).toBeVisible();
    await expect(page.getByText('Planning meeting')).not.toBeVisible();
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();
    await expect(page.getByText('Planning meeting')).toBeVisible();
    await expect(page.getByLabel('Suche')).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`from=${today}.*to=${defaultEnd}`));
  });

  test('allows a past range and preserves it on reload', async ({ page }) => {
    const pastStart = localDateAtOffset(-14);
    const pastEnd = localDateAtOffset(-7);
    const pastFeed = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:past-range\nDTSTART;VALUE=DATE:${icsDay(localDateAtOffset(-10))}\nSUMMARY:Historical appointment\nEND:VEVENT\nBEGIN:VEVENT\nUID:current-range\nDTSTART;VALUE=DATE:${icsDay(today)}\nSUMMARY:Current appointment\nEND:VEVENT\nEND:VCALENDAR`;
    await configurePage(page, { feed: pastFeed });
    await page.goto('/');
    await expect(page.getByText('Historical appointment')).not.toBeVisible();
    await page.getByRole('button', { name: 'Filter (aktiv)', exact: true }).click();
    await page.getByLabel('Von').fill(pastStart);
    await page.getByLabel('Bis').fill(pastEnd);
    await page.getByRole('button', { name: 'Filter anwenden' }).click();
    await expect(page.getByText('Historical appointment')).toBeVisible();
    await expect(page.getByText('Current appointment')).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`from=${pastStart}.*to=${pastEnd}`));
    await page.reload();
    await expect(page.getByText('Historical appointment')).not.toBeVisible();
    await expect(page.getByText('Current appointment')).toBeVisible();
    await expect(page).not.toHaveURL(/from=/);
    await page.getByRole('button', { name: 'Filter (aktiv)' }).click();
    await expect(page.getByLabel('Von')).toHaveValue(today);
    await expect(page.getByLabel('Bis')).toHaveValue(defaultEnd);
  });
});
