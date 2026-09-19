import { MAX_OCCURRENCES, type CalendarOccurrence } from './calendar.js';
import { buildProxyRequest } from './feed.js';

export interface CalendarSnapshot {
  schemaVersion: 1;
  sourceUrl: string;
  fetchedAt: string;
  occurrences: CalendarOccurrence[];
  partialData: boolean;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
  if (!match) return true;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3]);
}

function validOccurrenceDate(value: unknown, allDay: boolean): boolean {
  if (typeof value !== 'string') return false;
  if (allDay) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCFullYear() === Number(match[1])
      && date.getUTCMonth() === Number(match[2]) - 1
      && date.getUTCDate() === Number(match[3]);
  }
  return value.includes('T') && validDate(value);
}

function validOccurrence(value: unknown, sourceUrl: string): boolean {
  if (!value || typeof value !== 'object') return false;
  const occurrence = value as Record<string, unknown>;
  return typeof occurrence.uid === 'string'
    && occurrence.uid.length > 0
    && (occurrence.recurrenceId === null || validDate(occurrence.recurrenceId))
    && typeof occurrence.allDay === 'boolean'
    && validOccurrenceDate(occurrence.start, occurrence.allDay)
    && (occurrence.end === null || validOccurrenceDate(occurrence.end, occurrence.allDay))
    && (occurrence.recurring === undefined || typeof occurrence.recurring === 'boolean')
    && typeof occurrence.title === 'string'
    && occurrence.title.length > 0
    && (occurrence.location === null || typeof occurrence.location === 'string')
    && (occurrence.description === null || typeof occurrence.description === 'string')
    && (occurrence.timeZone === null || typeof occurrence.timeZone === 'string')
    && occurrence.sourceUrl === sourceUrl;
}

export function isValidSnapshot(value: unknown, sourceUrl: string): value is CalendarSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Record<string, unknown>;
  let normalizedUrl: string;
  try {
    normalizedUrl = buildProxyRequest(sourceUrl).url;
  } catch {
    return false;
  }
  if (!Array.isArray(snapshot.occurrences)) return false;
  const occurrences = snapshot.occurrences;
  if (!occurrences.every((occurrence) => validOccurrence(occurrence, sourceUrl))) return false;
  const unique = new Set(occurrences.map((occurrence) => {
    const item = occurrence as Record<string, unknown>;
    return `${item.uid}:${item.start}`;
  }));
  return snapshot.schemaVersion === 1
    && normalizedUrl === sourceUrl
    && snapshot.sourceUrl === sourceUrl
    && typeof snapshot.sourceUrl === 'string'
    && validDate(snapshot.fetchedAt)
    && occurrences.length <= MAX_OCCURRENCES
    && unique.size === occurrences.length
    && occurrences.every((occurrence, index, all) => index === 0 || occurrence.start >= all[index - 1].start)
    && typeof snapshot.partialData === 'boolean';
}

const DB_NAME = 'justcalendar';
const DB_VERSION = 1;
const SELECTION_STORE = 'selection';
const SNAPSHOT_STORE = 'snapshots';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(SELECTION_STORE)) database.createObjectStore(SELECTION_STORE);
    if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) database.createObjectStore(SNAPSHOT_STORE, { keyPath: 'sourceUrl' });
  };
  return requestResult(request);
}

export async function loadLocalOverride(): Promise<string | null> {
  const database = await openDatabase();
  const value = await requestResult(database.transaction(SELECTION_STORE).objectStore(SELECTION_STORE).get('localOverride'));
  database.close();
  if (typeof value !== 'string') return null;
  try {
    return buildProxyRequest(value).url;
  } catch {
    return null;
  }
}

export async function saveLocalOverride(url: string | null): Promise<void> {
  if (url !== null) buildProxyRequest(url);
  const database = await openDatabase();
  const transaction = database.transaction(SELECTION_STORE, 'readwrite');
  transaction.objectStore(SELECTION_STORE).put(url, 'localOverride');
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
  database.close();
}

export async function loadSnapshot(sourceUrl: string): Promise<CalendarSnapshot | null> {
  const database = await openDatabase();
  const value = await requestResult(database.transaction(SNAPSHOT_STORE).objectStore(SNAPSHOT_STORE).get(sourceUrl));
  database.close();
  if (!isValidSnapshot(value, sourceUrl)) return null;
  return {
    ...value,
    occurrences: value.occurrences.map((occurrence) => ({ ...occurrence, recurring: occurrence.recurring ?? false })),
  };
}

export async function saveSnapshot(snapshot: CalendarSnapshot): Promise<void> {
  if (!isValidSnapshot(snapshot, snapshot.sourceUrl)) throw new Error('Invalid calendar snapshot.');
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOT_STORE, 'readwrite');
  transaction.objectStore(SNAPSHOT_STORE).put(snapshot);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
  database.close();
}
