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
  return app.subscribe((state) => {
    root.replaceChildren();
    root.setAttribute('aria-busy', state.status === 'loading' ? 'true' : 'false');

    const header = element('header');
    header.append(element('p', 'JUSTCALENDAR'), element('h1', 'Upcoming events'));
    root.append(header);

    const source = element('section');
    source.className = 'source-panel';
    source.append(element('h2', 'Calendar source'));
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
      reset.addEventListener('click', () => void app.reset());
      sourceActions.append(reset);
    }
    sourceForm.append(sourceActions);
    sourceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      void app.replace(sourceInput.value);
    });
    const sourceHelp = element('p', 'Use HTTPS and a publicly accessible ICS feed.');
    sourceHelp.id = 'source-help';
    source.append(sourceForm, element('p', 'The viewer is read-only. It never edits this calendar.'), sourceHelp);
    root.append(source);

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
    }
    const retry = element('button', 'Refresh calendar');
    retry.type = 'button';
    retry.addEventListener('click', () => void app.refresh());
    status.append(retry);
    root.append(status);

    const filters = element('section');
    filters.className = 'filters';
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
      app.clearFilters();
      window.history.replaceState(null, '', window.location.pathname);
    });
    filterActions.append(apply, clear);
    filterForm.append(fromLabel, toLabel, queryLabel, filterActions);
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const next = { from: from.value || null, to: to.value || null, query: query.value };
      app.setFilters(next);
      updateFilterUrl({ ...state, filters: next });
    });
    filters.append(filterForm);
    if (state.filters.from || state.filters.to || state.filters.query.trim()) {
      filters.append(element('p', `Active filters: ${[state.filters.from && `from ${state.filters.from}`, state.filters.to && `to ${state.filters.to}`, state.filters.query && `matching '${state.filters.query}'`].filter(Boolean).join(', ')}`));
    }
    root.append(filters);

    const content = element('section');
    content.className = 'events';
    content.append(element('h2', 'Events'));
    renderEvents(content, state);
    root.append(content);
  });
}
