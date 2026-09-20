import { searchFromFilters, visibleOccurrences, type AppState, type CalendarApp } from './app.js';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function eventLabel(start: string, allDay: boolean): string {
  if (allDay) return `All day, ${start}`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(start));
}

function renderEvents(container: HTMLElement, state: AppState): void {
  const events = visibleOccurrences(state);
  if (!events.length) {
    container.append(element('p', state.snapshot ? 'No events match the current view.' : 'No offline calendar is available yet.'));
    return;
  }
  const list = element('ul');
  list.className = 'event-list';
  for (const occurrence of events) {
    const item = element('li');
    const details = element('details');
    const summary = element('summary');
    summary.append(
      element('strong', occurrence.title),
      element('span', `${eventLabel(occurrence.start, occurrence.allDay)}${occurrence.recurring ? ' · Recurring' : ''}`),
    );
    details.append(summary);
    const content = element('div');
    content.className = 'event-details';
    if (occurrence.end) content.append(element('p', `Ends: ${eventLabel(occurrence.end, occurrence.allDay)}`));
    if (occurrence.location) content.append(element('p', `Location: ${occurrence.location}`));
    if (occurrence.description) content.append(element('p', occurrence.description));
    details.append(content);
    item.append(details);
    list.append(item);
  }
  container.append(list);
}

function updateFilterUrl(state: AppState): void {
  const next = `${window.location.pathname}${searchFromFilters(state.filters)}`;
  window.history.replaceState(null, '', next);
}

export function mountCalendarApp(root: HTMLElement, app: CalendarApp): () => void {
  let openPanel: 'settings' | 'filters' | null = null;
  let focusTarget: 'settings' | 'filters' | 'refresh' | null = null;

  const render = (state: AppState) => {
    root.replaceChildren();
    root.setAttribute('aria-busy', state.status === 'loading' ? 'true' : 'false');

    const header = element('header');
    header.append(element('p', 'JUSTCALENDAR'), element('h1', 'Upcoming events'));
    root.append(header);

    const content = element('section');
    content.className = 'events';
    content.append(element('h2', 'Events'));
    renderEvents(content, state);
    root.append(content);

    const source = element('section');
    source.className = 'source-panel';
    source.id = 'settings-panel';
    source.hidden = openPanel !== 'settings';
    source.append(element('h2', 'Calendar settings'));
    const sourceForm = element('form');
    const sourceLabel = element('label', 'Public ICS URL');
    const sourceInput = element('input');
    sourceInput.type = 'url';
    sourceInput.required = true;
    sourceInput.value = state.activeUrl ?? '';
    sourceInput.placeholder = 'https://example.com/calendar.ics';
    sourceInput.setAttribute('aria-describedby', 'source-help');
    sourceLabel.append(sourceInput);
    sourceForm.append(sourceLabel);
    const sourceActions = element('div');
    sourceActions.className = 'actions';
    const replace = element('button', 'Use this calendar');
    replace.type = 'submit';
    sourceActions.append(replace);
    if (state.localOverride) {
      const reset = element('button', 'Reset deployment URL');
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
    const sourceHelp = element('p', 'Use HTTPS and a publicly accessible ICS feed.');
    sourceHelp.id = 'source-help';
    source.append(sourceForm, element('p', 'The viewer is read-only. It never edits this calendar.'), sourceHelp);

    const filters = element('section');
    filters.className = 'filters';
    filters.id = 'filters-panel';
    filters.hidden = openPanel !== 'filters';
    filters.append(element('h2', 'Filter events'));
    const filterForm = element('form');
    const from = element('input');
    from.type = 'date';
    from.value = state.filters.from ?? '';
    const fromLabel = element('label', 'From');
    fromLabel.append(from);
    const to = element('input');
    to.type = 'date';
    to.value = state.filters.to ?? '';
    const toLabel = element('label', 'To');
    toLabel.append(to);
    const query = element('input');
    query.type = 'search';
    query.placeholder = 'Title, location, or description';
    query.value = state.filters.query;
    const queryLabel = element('label', 'Search');
    queryLabel.append(query);
    const filterActions = element('div');
    filterActions.className = 'actions';
    const apply = element('button', 'Apply filters');
    apply.type = 'submit';
    const clear = element('button', 'Clear');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      openPanel = null;
      focusTarget = 'filters';
      app.clearFilters();
      focusTarget = null;
      window.history.replaceState(null, '', window.location.pathname);
    });
    filterActions.append(apply, clear);
    filterForm.append(fromLabel, toLabel, queryLabel, filterActions);
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = { from: from.value || null, to: to.value || null, query: query.value };
      focusTarget = 'filters';
      app.setFilters(next);
      focusTarget = null;
      updateFilterUrl({ ...state, filters: next });
    });
    filters.append(filterForm);
    if (state.filters.from || state.filters.to || state.filters.query.trim()) {
      filters.append(element('p', `Active filters: ${[state.filters.from && `from ${state.filters.from}`, state.filters.to && `to ${state.filters.to}`, state.filters.query && `matching '${state.filters.query}'`].filter(Boolean).join(', ')}`));
    }
    const secondary = element('div');
    secondary.className = 'secondary-controls';
    const togglePanel = (panel: 'settings' | 'filters') => {
      openPanel = openPanel === panel ? null : panel;
      focusTarget = panel;
      render(app.getState());
      focusTarget = null;
    };
    const settingsButton = element('button', 'Settings');
    settingsButton.type = 'button';
    settingsButton.setAttribute('aria-controls', source.id);
    settingsButton.setAttribute('aria-expanded', String(openPanel === 'settings'));
    settingsButton.addEventListener('click', () => togglePanel('settings'));
    const filtersButton = element('button', state.filters.from || state.filters.to || state.filters.query ? 'Filters (active)' : 'Filters');
    filtersButton.type = 'button';
    filtersButton.setAttribute('aria-controls', filters.id);
    filtersButton.setAttribute('aria-expanded', String(openPanel === 'filters'));
    filtersButton.addEventListener('click', () => togglePanel('filters'));
    secondary.append(settingsButton, source, filtersButton, filters);
    root.append(secondary);

    const status = element('section');
    status.className = 'status-panel';
    status.setAttribute('aria-live', 'polite');
    if (state.status === 'loading') status.append(element('p', 'Loading calendar…'));
    if (state.error) {
      const message = element('p', state.stale ? `Showing the last saved snapshot. Refresh failed: ${state.error}` : state.error);
      message.className = state.stale ? 'warning' : 'error';
      status.append(message);
    }
    if (state.snapshot) {
      status.append(element('p', `Last refreshed: ${new Date(state.snapshot.fetchedAt).toLocaleString()}`));
      if (state.snapshot.partialData) status.append(element('p', 'Some malformed calendar items were skipped.'));
    } else status.append(element('p', 'Not refreshed yet'));
    const retry = element('button', 'Refresh calendar');
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
