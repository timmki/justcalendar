import { normalizeCalendar, filterOccurrences, type FilterSelection, type NormalizedCalendar } from './calendar.js';
import { defaultDateRange } from './date-range.js';
import { buildProxyRequest, type RuntimeConfig } from './feed.js';
import type { CalendarSnapshot } from './storage.js';

export type AppStatus = 'loading' | 'ready' | 'error' | 'configuration';

export interface AppState {
  status: AppStatus;
  activeUrl: string | null;
  localOverride: string | null;
  title: string | null;
  subtitle: string | null;
  snapshot: CalendarSnapshot | null;
  filters: FilterSelection;
  error: string | null;
  stale: boolean;
}

export interface AppDependencies {
  config: RuntimeConfig | null;
  loadConfig?: () => Promise<RuntimeConfig | null>;
  request(url: string): Promise<string>;
  loadLocalOverride(): Promise<string | null>;
  saveLocalOverride(url: string | null): Promise<void>;
  loadSnapshot(url: string): Promise<CalendarSnapshot | null>;
  saveSnapshot(snapshot: CalendarSnapshot): Promise<void>;
  now?: () => Date;
}

export interface CalendarApp {
  getState(): AppState;
  subscribe(listener: (state: AppState) => void): () => void;
  start(): Promise<void>;
  refresh(): Promise<void>;
  replace(url: string): Promise<void>;
  reset(): Promise<void>;
  setFilters(filters: FilterSelection): void;
  clearFilters(): void;
}

const emptyFilters = (): FilterSelection => ({ from: null, to: null, query: '' });
const defaultFilters = (now: Date): FilterSelection => ({ ...defaultDateRange(now), query: '' });

export function filtersFromSearch(search: string, now = new Date()): FilterSelection {
  const params = new URLSearchParams(search);
  const filters = normalizeFilters({ from: params.get('from'), to: params.get('to'), query: params.get('query') ?? '' });
  return !params.has('from') && !params.has('to') ? { ...defaultFilters(now), query: filters.query } : filters;
}

export function searchFromFilters(filters: FilterSelection): string {
  const normalized = normalizeFilters(filters);
  const params = new URLSearchParams();
  if (normalized.from) params.set('from', normalized.from);
  if (normalized.to) params.set('to', normalized.to);
  if (normalized.query.trim()) params.set('query', normalized.query.trim());
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function clearFilterParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete('from');
  params.delete('to');
  params.delete('query');
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function normalizeFilters(filters: FilterSelection): FilterSelection {
  const date = (value: string | null) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? value : null;
  };
  const from = date(filters.from);
  const to = date(filters.to);
  if (from && to && from > to) return emptyFilters();
  return { from, to, query: filters.query.trim() };
}

export function createCalendarApp(dependencies: AppDependencies): CalendarApp {
  const listeners = new Set<(state: AppState) => void>();
  let config = dependencies.config;
  const currentDate = () => dependencies.now?.() ?? new Date();
  const branding = () => ({ title: config?.title ?? null, subtitle: config?.subtitle ?? null });
  let state: AppState = {
    status: 'loading',
    activeUrl: null,
    localOverride: null,
    ...branding(),
    snapshot: null,
    filters: defaultFilters(currentDate()),
    error: null,
    stale: false,
  };

  const emit = () => listeners.forEach((listener) => listener(state));
  const update = (patch: Partial<AppState>) => {
    state = { ...state, ...patch };
    emit();
  };
  const selectedUrl = () => state.localOverride ?? config?.defaultFeedUrl ?? null;

  async function refresh(): Promise<void> {
    let url = state.activeUrl ?? selectedUrl();
    if (!url && dependencies.loadConfig) {
      config = await dependencies.loadConfig().catch(() => null);
      url = selectedUrl();
      update({ activeUrl: url, ...branding() });
    }
    if (!url) {
      update({ status: 'configuration', activeUrl: null, error: 'No deployment calendar URL is configured.', stale: false });
      return;
    }
    update({ status: 'loading', activeUrl: url, error: null });
    try {
      const currentTime = currentDate();
      const normalized: NormalizedCalendar = normalizeCalendar(
        await dependencies.request(url),
        url,
        currentTime,
      );
      const snapshot: CalendarSnapshot = {
        schemaVersion: 1,
        sourceUrl: url,
        fetchedAt: currentTime.toISOString(),
        occurrences: normalized.occurrences,
        partialData: normalized.partialData,
      };
      await dependencies.saveSnapshot(snapshot).catch(() => undefined);
      update({ status: 'ready', activeUrl: url, snapshot, error: null, stale: false });
    } catch (error) {
      const saved = await dependencies.loadSnapshot(url).catch(() => null);
      const fallback = saved ?? (state.snapshot?.sourceUrl === url ? state.snapshot : null);
      update({
        status: fallback ? 'ready' : 'error',
        activeUrl: url,
        snapshot: fallback,
        error: error instanceof Error ? error.message : 'Calendar feed unavailable.',
        stale: Boolean(fallback),
      });
    }
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    start: async () => {
      const localOverride = await dependencies.loadLocalOverride().catch(() => null);
      update({ localOverride, activeUrl: localOverride ?? config?.defaultFeedUrl ?? null, ...branding() });
      await refresh();
    },
    refresh,
    replace: async (url) => {
      try {
        const normalizedUrl = buildProxyRequest(url).url;
        update({ status: 'loading', error: null });
        const currentTime = currentDate();
        const normalized = normalizeCalendar(
          await dependencies.request(normalizedUrl),
          normalizedUrl,
          currentTime,
        );
        const snapshot: CalendarSnapshot = {
          schemaVersion: 1,
          sourceUrl: normalizedUrl,
          fetchedAt: currentTime.toISOString(),
          occurrences: normalized.occurrences,
          partialData: normalized.partialData,
        };
        await dependencies.saveSnapshot(snapshot).catch(() => undefined);
        await dependencies.saveLocalOverride(normalizedUrl).catch(() => undefined);
        update({
          status: 'ready',
          activeUrl: normalizedUrl,
          localOverride: normalizedUrl,
          snapshot,
          error: null,
          stale: false,
        });
      } catch (error) {
        update({ status: state.snapshot ? 'ready' : 'error', error: error instanceof Error ? error.message : 'Calendar feed unavailable.' });
      }
    },
    reset: async () => {
      await dependencies.saveLocalOverride(null).catch(() => undefined);
      update({ localOverride: null, activeUrl: config?.defaultFeedUrl ?? null });
      await refresh();
    },
    setFilters: (filters) => update({ filters: normalizeFilters(filters) }),
    clearFilters: () => update({ filters: defaultFilters(currentDate()) }),
  };
}

export function visibleOccurrences(state: AppState) {
  return state.snapshot ? filterOccurrences(state.snapshot.occurrences, state.filters) : [];
}
