import { readdir, stat } from 'node:fs/promises';

const assetDir = new URL('../dist/assets/', import.meta.url);
const files = await readdir(assetDir);
const sizes = await Promise.all(files.map(async (file) => ({
  file,
  size: (await stat(new URL(file, assetDir))).size,
})));
const javascript = sizes.filter(({ file }) => file.endsWith('.js')).reduce((total, asset) => total + asset.size, 0);
const css = sizes.filter(({ file }) => file.endsWith('.css')).reduce((total, asset) => total + asset.size, 0);
const budgets = { javascript: 150 * 1024, css: 32 * 1024 };

console.log(`route / bundle: ${javascript} bytes JS, ${css} bytes CSS`);
if (javascript > budgets.javascript || css > budgets.css) {
  throw new Error(`Bundle budget exceeded: ${JSON.stringify({ javascript, css, budgets })}`);
}
