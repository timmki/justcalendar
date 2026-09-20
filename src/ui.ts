import { searchFromFilters, visibleOccurrences, type AppState, type CalendarApp } from './app.js';
import { occurrenceRelevance } from './relevance.js';

const DEFAULT_TITLE = 'Kommende Termine';
const DEFAULT_SUBTITLE = 'Mein Kalender';

const copy = {
  events: 'Termine',
  noEvents: 'Keine Termine entsprechen der aktuellen Ansicht.',
  noOfflineCalendar: 'Noch kein Offline-Kalender verfügbar.',
  allDay: 'Ganztägig',
  recurring: 'Wiederkehrend',
  ends: 'Endet',
  location: 'Ort',
  openDetails: 'Details anzeigen',
  closeDetails: 'Details ausblenden',
  maps: 'In Google Maps öffnen',
  settings: 'Einstellungen',
  settingsHeading: 'Kalendereinstellungen',
  publicIcsUrl: 'Öffentliche ICS-URL',
  useCalendar: 'Diesen Kalender verwenden',
  resetDeploymentUrl: 'Bereitstellungs-URL zurücksetzen',
  sourceHelp: 'Verwende einen öffentlichen HTTPS-ICS-Feed.',
  readOnly: 'Die Ansicht ist schreibgeschützt. Dieser Kalender wird nicht verändert.',
  filters: 'Filter',
  activeFilters: 'Filter (aktiv)',
  filterHeading: 'Termine filtern',
  from: 'Von',
  to: 'Bis',
  search: 'Suche',
  searchPlaceholder: 'Titel, Ort oder Beschreibung',
  applyFilters: 'Filter anwenden',
  clear: 'Zurücksetzen',
  moreEvents: 'Weitere Termine anzeigen',
  past: 'Vergangen',
  loading: 'Kalender wird geladen…',
  stale: 'Der letzte gespeicherte Stand wird angezeigt.',
  refreshFailed: 'Die Aktualisierung ist fehlgeschlagen.',
  lastRefreshed: 'Zuletzt aktualisiert',
  partialData: 'Einige fehlerhafte Kalendereinträge wurden übersprungen.',
  notRefreshed: 'Noch nicht aktualisiert.',
  refresh: 'Kalender aktualisieren',
  noConfiguredUrl: 'Es ist keine Kalender-URL für diese Bereitstellung konfiguriert.',
  feedUnavailable: 'Der Kalender-Feed ist nicht verfügbar.',
  runtimeUnavailable: 'Die Laufzeitkonfiguration ist nicht verfügbar.',
  runtimeTimeout: 'Die Laufzeitkonfiguration hat zu lange gebraucht.',
  requestTimeout: 'Die Kalenderanfrage hat zu lange gebraucht.',
  invalidUrl: 'Die Kalender-URL ist ungültig.',
  tooLongUrl: 'Die Kalender-URL ist zu lang.',
};

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function eventLabel(start: string, allDay: boolean): string {
  const date = new Date(allDay ? `${start}T00:00:00Z` : start);
  return allDay ? `${copy.allDay}, ${dateFormatter.format(date)}` : dateTimeFormatter.format(date);
}

function googleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function localizeError(error: string): string {
  const messages = new Map([
    ['No deployment calendar URL is configured.', copy.noConfiguredUrl],
    ['Calendar feed unavailable.', copy.feedUnavailable],
    ['Runtime configuration unavailable.', copy.runtimeUnavailable],
    ['Runtime configuration timed out.', copy.runtimeTimeout],
    ['Calendar request timed out.', copy.requestTimeout],
    ['Only credential-free HTTPS URLs are supported.', copy.invalidUrl],
    ['A feed URL is required.', copy.invalidUrl],
    ['The feed URL is too long.', copy.tooLongUrl],
  ]);
  return messages.get(error) ?? (error.startsWith('Der ') ? error : copy.feedUnavailable);
}

function appendLabeledValue(container: HTMLElement, label: string, value: string): void {
  const row = element('p');
  row.append(element('strong', `${label}: `), document.createTextNode(value));
  container.append(row);
}

function createEventCard(occurrence: ReturnType<typeof visibleOccurrences>[number], now: Date): HTMLLIElement {
  const item = element('li');
  item.className = 'event-card';
  const relevance = occurrenceRelevance(occurrence, now);
  if (relevance === 'past') item.classList.add('is-past');
  const details = element('details');
  details.className = 'event-disclosure';
  const summary = element('summary');
  const summaryMain = element('span');
  summaryMain.className = 'event-summary-main';
  const summaryTitle = element('strong', occurrence.title);
  const summaryMeta = element('span', `${eventLabel(occurrence.start, occurrence.allDay)}${occurrence.recurring ? ` · ${copy.recurring}` : ''}`);
  summaryMain.append(summaryTitle, summaryMeta);
  if (relevance === 'past') {
    const pastState = element('span', copy.past);
    pastState.className = 'event-status';
    summaryMain.append(pastState);
  }
  const affordance = element('span', copy.openDetails);
  affordance.className = 'event-affordance';
  summary.append(summaryMain, affordance);
  details.append(summary);

  const content = element('div');
  content.className = 'event-details';
  if (occurrence.end) appendLabeledValue(content, copy.ends, eventLabel(occurrence.end, occurrence.allDay));
  if (occurrence.recurring) appendLabeledValue(content, copy.recurring, 'Ja');
  if (occurrence.location) {
    const locationRow = element('p');
    const mapLink = element('a', copy.maps);
    mapLink.href = googleMapsUrl(occurrence.location);
    mapLink.target = '_blank';
    mapLink.rel = 'noreferrer noopener';
    mapLink.setAttribute('aria-label', `${copy.location} ${occurrence.location} ${copy.maps}`);
    locationRow.append(
      element('strong', `${copy.location}: `),
      document.createTextNode(occurrence.location),
      document.createTextNode(' · '),
      mapLink,
    );
    content.append(locationRow);
  }
  if (occurrence.description) content.append(element('p', occurrence.description));
  details.append(content);
  details.addEventListener('toggle', () => {
    item.classList.toggle('is-open', details.open);
    affordance.textContent = details.open ? copy.closeDetails : copy.openDetails;
  });
  item.append(details);
  return item;
}

function renderEvents(container: HTMLElement, state: AppState, renderToken: { value: number }): void {
  const renderId = ++renderToken.value;
  const events = visibleOccurrences(state);
  if (!events.length) {
    container.append(element('p', state.snapshot ? copy.noEvents : copy.noOfflineCalendar));
    return;
  }

  const list = element('ul');
  list.className = 'event-list';
  const now = new Date();
  container.append(list);
  let index = 0;
  let moreButton: HTMLButtonElement | null = null;
  const appendBatch = (size: number) => {
    if (renderToken.value !== renderId) return;
    const batch = document.createDocumentFragment();
    const end = Math.min(index + size, events.length);
    for (; index < end; index += 1) batch.append(createEventCard(events[index], now));
    list.append(batch);
    if (index < events.length) {
      if (!moreButton) {
        moreButton = element('button', copy.moreEvents);
        moreButton.className = 'load-more';
        moreButton.type = 'button';
        moreButton.addEventListener('click', () => appendBatch(200));
        container.append(moreButton);
      }
      moreButton.textContent = `${copy.moreEvents} (${events.length - index})`;
    } else {
      moreButton?.remove();
    }
  };
  appendBatch(100);
}

function updateFilterUrl(state: AppState): void {
  const next = `${window.location.pathname}${searchFromFilters(state.filters)}`;
  window.history.replaceState(null, '', next);
}

export function mountCalendarApp(root: HTMLElement, app: CalendarApp): () => void {
  let openPanel: 'settings' | 'filters' | null = null;
  let focusTarget: 'settings' | 'filters' | 'refresh' | null = null;
  const eventRenderToken = { value: 0 };
  const logoFallback = element('span', '📅');
  logoFallback.className = 'brand-logo-fallback';
  logoFallback.setAttribute('aria-hidden', 'true');
  const logo = element('img');
  logo.className = 'brand-logo';
  logo.alt = '';
  logo.hidden = true;
  let logoCandidate = 0;
  const logoSources = ['/logo.png', '/logo.jpg'];
  const loadLogo = () => {
    if (logoCandidate >= logoSources.length) {
      logo.hidden = true;
      logoFallback.hidden = false;
      return;
    }
    logo.src = logoSources[logoCandidate];
    logoCandidate += 1;
  };
  logo.addEventListener('load', () => {
    logoFallback.hidden = true;
    logo.hidden = false;
  });
  logo.addEventListener('error', loadLogo);
  loadLogo();

  const render = (state: AppState) => {
    root.replaceChildren();
    root.setAttribute('aria-busy', state.status === 'loading' ? 'true' : 'false');
    document.documentElement.lang = 'de';
    const title = state.title?.trim() || DEFAULT_TITLE;
    const subtitle = state.subtitle?.trim() || DEFAULT_SUBTITLE;
    document.title = title;

    const header = element('header');
    const brand = element('div');
    brand.className = 'brand-lockup';
    const brandText = element('div');
    const subtitleElement = element('p', subtitle);
    subtitleElement.className = 'eyebrow';
    brandText.append(subtitleElement, element('h1', title));
    brand.append(logoFallback, logo, brandText);
    header.append(brand);
    root.append(header);

    const content = element('section');
    content.className = 'events';
    content.append(element('h2', copy.events));
    renderEvents(content, state, eventRenderToken);
    root.append(content);

    const source = element('section');
    source.className = 'source-panel';
    source.id = 'settings-panel';
    source.hidden = openPanel !== 'settings';
    source.append(element('h2', copy.settingsHeading));
    const sourceForm = element('form');
    const sourceLabel = element('label', copy.publicIcsUrl);
    const sourceInput = element('input');
    sourceInput.type = 'url';
    sourceInput.required = true;
    sourceInput.value = state.activeUrl ?? '';
    sourceInput.placeholder = 'https://beispiel.de/kalender.ics';
    sourceInput.setAttribute('aria-describedby', 'source-help');
    sourceLabel.append(sourceInput);
    sourceForm.append(sourceLabel);
    const sourceActions = element('div');
    sourceActions.className = 'actions';
    const replace = element('button', copy.useCalendar);
    replace.type = 'submit';
    sourceActions.append(replace);
    if (state.localOverride) {
      const reset = element('button', copy.resetDeploymentUrl);
      reset.type = 'button';
      reset.addEventListener('click', () => {
        focusTarget = 'settings';
        void app.reset().finally(() => { focusTarget = null; });
      });
      sourceActions.append(reset);
    }
    sourceForm.append(sourceActions);
    sourceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      focusTarget = 'settings';
      void app.replace(sourceInput.value).finally(() => { focusTarget = null; });
    });
    const sourceHelp = element('p', copy.sourceHelp);
    sourceHelp.id = 'source-help';
    source.append(sourceForm, element('p', copy.readOnly), sourceHelp);

    const filters = element('section');
    filters.className = 'filters';
    filters.id = 'filters-panel';
    filters.hidden = openPanel !== 'filters';
    filters.append(element('h2', copy.filterHeading));
    const filterForm = element('form');
    const from = element('input');
    from.type = 'date';
    from.value = state.filters.from ?? '';
    const fromLabel = element('label', copy.from);
    fromLabel.append(from);
    const to = element('input');
    to.type = 'date';
    to.value = state.filters.to ?? '';
    const toLabel = element('label', copy.to);
    toLabel.append(to);
    const query = element('input');
    query.type = 'search';
    query.placeholder = copy.searchPlaceholder;
    query.value = state.filters.query;
    const queryLabel = element('label', copy.search);
    queryLabel.append(query);
    const filterActions = element('div');
    filterActions.className = 'actions';
    const apply = element('button', copy.applyFilters);
    apply.type = 'submit';
    const clear = element('button', copy.clear);
    clear.type = 'button';
    clear.addEventListener('click', () => {
      openPanel = null;
      focusTarget = 'filters';
      app.clearFilters();
      updateFilterUrl(app.getState());
      focusTarget = null;
    });
    filterActions.append(apply, clear);
    filterForm.append(fromLabel, toLabel, queryLabel, filterActions);
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = { from: from.value || null, to: to.value || null, query: query.value };
      focusTarget = 'filters';
      app.setFilters(next);
      updateFilterUrl(app.getState());
      focusTarget = null;
    });
    filters.append(filterForm);
    if (state.filters.from || state.filters.to || state.filters.query.trim()) {
      const active = [
        state.filters.from && `ab ${state.filters.from}`,
        state.filters.to && `bis ${state.filters.to}`,
        state.filters.query && `mit „${state.filters.query}“`,
      ].filter(Boolean).join(', ');
      filters.append(element('p', `Aktive Filter: ${active}`));
    }

    const secondary = element('div');
    secondary.className = 'secondary-controls';
    const togglePanel = (panel: 'settings' | 'filters') => {
      openPanel = openPanel === panel ? null : panel;
      focusTarget = panel;
      render(app.getState());
      focusTarget = null;
    };
    const settingsButton = element('button', copy.settings);
    settingsButton.type = 'button';
    settingsButton.setAttribute('aria-controls', source.id);
    settingsButton.setAttribute('aria-expanded', String(openPanel === 'settings'));
    settingsButton.addEventListener('click', () => togglePanel('settings'));
    const hasFilters = Boolean(state.filters.from || state.filters.to || state.filters.query.trim());
    const filtersButton = element('button', hasFilters ? copy.activeFilters : copy.filters);
    filtersButton.type = 'button';
    filtersButton.setAttribute('aria-controls', filters.id);
    filtersButton.setAttribute('aria-expanded', String(openPanel === 'filters'));
    filtersButton.addEventListener('click', () => togglePanel('filters'));
    secondary.append(settingsButton, source, filtersButton, filters);
    root.append(secondary);

    const status = element('section');
    status.className = 'status-panel';
    status.setAttribute('aria-live', 'polite');
    if (state.status === 'loading') status.append(element('p', copy.loading));
    if (state.error) {
      const message = element('p', state.stale ? `${copy.stale} ${copy.refreshFailed}` : localizeError(state.error));
      message.className = state.stale ? 'warning' : 'error';
      status.append(message);
    }
    if (state.snapshot) {
      status.append(element('p', `${copy.lastRefreshed}: ${dateTimeFormatter.format(new Date(state.snapshot.fetchedAt))}`));
      if (state.snapshot.partialData) status.append(element('p', copy.partialData));
    } else status.append(element('p', copy.notRefreshed));
    const retry = element('button', copy.refresh);
    retry.type = 'button';
    retry.id = 'refresh-button';
    retry.addEventListener('click', () => {
      openPanel = null;
      focusTarget = 'refresh';
      void app.refresh().finally(() => { focusTarget = null; });
    });
    status.append(retry);
    root.append(status);

    if (focusTarget) {
      const selector = focusTarget === 'refresh' ? '#refresh-button' : `button[aria-controls="${focusTarget}-panel"]`;
      root.querySelector<HTMLButtonElement>(selector)?.focus();
    }
  };

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !openPanel) return;
    focusTarget = openPanel;
    openPanel = null;
    render(app.getState());
    focusTarget = null;
  });
  return app.subscribe(render);
}
