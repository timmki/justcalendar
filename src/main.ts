import './styles.css';
import { clearFilterParams, createCalendarApp } from './app.js';
import { FeedError, requestCalendar, requestRuntimeConfig } from './feed.js';
import { mountCalendarApp } from './ui.js';
import { loadLocalOverride, loadSnapshot, saveLocalOverride, saveSnapshot } from './storage.js';
import { createTelemetry } from './telemetry.js';

async function loadConfig() {
  try {
    return await requestRuntimeConfig();
  } catch {
    return null;
  }
}

function telemetryReason(error: unknown): string {
  if (error instanceof FeedError) {
    const reasons: Record<string, string> = {
      'invalid-target': 'invalid_request',
      'invalid-request': 'invalid_request',
      'request-too-large': 'invalid_request',
      'unsafe-target': 'target_not_allowed',
      'body-too-large': 'response_too_large',
      'too-many-requests': 'rate_limited',
      'redirect-rejected': 'redirect_rejected',
      'upstream-timeout': 'upstream_timeout',
      'dns-failure': 'upstream_unavailable',
      'upstream-failure': 'upstream_unavailable',
    };
    return reasons[error.reason] ?? 'upstream_unavailable';
  }
  return error instanceof Error && error.message.includes('timed out') ? 'upstream_timeout' : 'upstream_unavailable';
}

async function main(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  const cleanSearch = clearFilterParams(window.location.search);
  if (cleanSearch !== window.location.search) {
    window.history.replaceState(null, '', `${window.location.pathname}${cleanSearch}${window.location.hash}`);
  }
  const config = await loadConfig();
  const telemetry = createTelemetry(config?.telemetryEndpoint ?? null, fetch, { appVersion: config?.appVersion ?? 'development' });
  if (!config) telemetry.report('configuration_error', { reason: 'configuration_unavailable' });
  telemetry.registerVitals();
  const app = createCalendarApp({
    config,
    request: async (url) => {
      try {
        return await requestCalendar(url);
      } catch (error) {
        telemetry.report('feed_load_failed', { reason: telemetryReason(error) });
        throw error;
      }
    },
    loadConfig,
    loadLocalOverride,
    saveLocalOverride,
    loadSnapshot,
    saveSnapshot,
  });
  mountCalendarApp(root, app);
  await app.start();
  if (app.getState().snapshot) telemetry.report('snapshot_loaded', { stale: app.getState().stale });
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/service-worker.js').then(async () => {
      await navigator.serviceWorker.ready;
      const assets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"]')]
        .map((asset) => 'src' in asset ? asset.src : asset.href);
      await Promise.all(assets.map((asset) => fetch(asset, { cache: 'no-store' }).catch(() => undefined)));
    });
  }
}

void main();
