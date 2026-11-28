// Renders assets/img/og.png (1200x630 link preview) from assets/img/og.svg,
// inlining the character renders it references. Run from the site root:
//   node tools/render-og.mjs
// Playwright-core is found through PLAYWRIGHT_CORE (default $TMP/axe/node_modules/playwright-core).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const site = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const pw = process.env.PLAYWRIGHT_CORE || path.join(process.env.TMP || '/tmp', 'axe/node_modules/playwright-core/index.mjs');
const { chromium } = await import(pathToFileURL(pw.endsWith('.mjs') ? pw : path.join(pw, 'index.mjs')).href);

const img = path.join(site, 'assets/img');
const svg = fs.readFileSync(path.join(img, 'og.svg'), 'utf8').replace(/href="(chars\/[a-z-]+\.webp)"/g, (_, f) =>
  `href="data:image/webp;base64,${fs.readFileSync(path.join(img, f)).toString('base64')}"`);

const b = await chromium.launch({ channel: 'msedge' });
const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
await pg.waitForTimeout(400);
await pg.screenshot({ path: path.join(img, 'og.png') });
await b.close();
console.log('wrote assets/img/og.png');
