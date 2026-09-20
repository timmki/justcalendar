import { readFile, writeFile } from 'node:fs/promises';

const appName = process.env.JUSTCALENDAR_SUBTITLE?.trim()?.slice(0, 120);
if (!appName) process.exit(0);

const manifestPath = 'dist/manifest.webmanifest';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.name = appName;
manifest.short_name = appName;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));
const escapedTitle = escapeHtml(appName);
const indexPath = 'dist/index.html';
const index = await readFile(indexPath, 'utf8');
const updatedIndex = index
  .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, (_, prefix, suffix) => `${prefix}${escapedTitle}${suffix}`)
  .replace(/(<title>)[^<]*(<\/title>)/, (_, prefix, suffix) => `${prefix}${escapedTitle}${suffix}`);
await writeFile(indexPath, updatedIndex, 'utf8');
