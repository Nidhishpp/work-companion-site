#!/usr/bin/env node
// Renders the site's character images from the app's real three.js characters.
// This is the only way to make assets/img/chars/<id>{,-idle,-walk,-wave}.webp:
// don't hand-edit or redraw them, re-run this after a character changes.
//
//   node tools/render-characters.mjs [path/to/work-companion/linux] [site-id ...]
//   (or WC_APP_LINUX=D:/Work Companion/linux node tools/render-characters.mjs)
//
// Needs playwright-core (PLAYWRIGHT_CORE=<path to the package>, default
// $TMP/axe/node_modules/playwright-core) and Microsoft Edge. It serves the app's
// linux/ folder, opens its tools/preview.html per character on a virtual clock,
// grabs only the overlay's WebGL canvas (never the bubble or other DOM UI) with
// a transparent clear, and encodes WebP in the page. Nothing in the app changes.
// Outputs, per character, at one shared scale and baseline:
//   <id>.webp 256x256 idle still; <id>-idle/-walk/-wave.webp 12-frame 3072x256 strips.
// WC_CONTACT=<png> also writes a contact sheet; WC_WEBP_Q sets quality (0.86).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, '..');
const args = process.argv.slice(2);
const appArg = args[0] && fs.existsSync(path.join(args[0], 'tools', 'preview.html')) ? args.shift() : null;
const root = path.resolve(appArg || process.env.WC_APP_LINUX || 'D:/Work Companion/linux');
if (!fs.existsSync(path.join(root, 'tools', 'preview.html'))) throw new Error(`No tools/preview.html under ${root}`);
const OUT = path.join(site, 'assets', 'img', 'chars');
const Q = Number(process.env.WC_WEBP_Q || 0.86);
const pwPath = process.env.PLAYWRIGHT_CORE || path.join(os.tmpdir(), 'axe', 'node_modules', 'playwright-core');
const { chromium } = createRequire(import.meta.url)(pwPath);

// site id -> app id
const CHARS = { mug: 'mugsy', robot: 'bloop', cat: 'whiskers', blob: 'blob', ghost: 'ghost',
  spidey: 'spidey', owl: 'hoot', plant: 'sprig', dragon: 'ember', aviator: 'pip' };
const only = args.filter((a) => CHARS[a]);
const SIZE = 256, FRAMES = 12, BASE = 8, TOP = 6, SIDE = 4;
const IDLE_SECS = (2 * Math.PI) / 2.1;  // the overlay's breathing period, so the loop is seamless
const WALK_SECS = (2 * Math.PI) / 9;    // the overlay's walk bob period (mover 'walk' state)
const WAVE = 'notify';                  // the raised-arm wave every character greets with

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
function serve() {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

// Window px of the feet at rest: the overlay's camera (overlay.js CAM, FOV 30,
// 420x560 frame) projecting the world origin; x is the frame centre.
function footY() {
  const n = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = n([0, 1.3 - 1.75, -6.1]), r = n(cross(f, [0, 1, 0])), u = cross(r, f);
  const rel = [0, -1.75, -6.1];
  const ndc = dot(rel, u) / (dot(rel, f) * Math.tan((15 * Math.PI) / 180));
  return ((1 - ndc) / 2) * 560;
}
const FOOT = { x: 210, y: footY() };

// In the page: deterministic randomness, and a capture helper that composites
// the cropped overlay canvas back into its 420x560 window, transparent.
function init() {
  let s = 1234567;
  Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  window.__grab = () => {
    const stage = document.getElementById('stage');
    const c = document.createElement('canvas');
    c.width = 420; c.height = 560;
    const g = c.getContext('2d');
    if (stage.style.visibility !== 'hidden') {
      const m = new DOMMatrix(getComputedStyle(stage).transform);
      g.drawImage(stage, m.e, m.f, stage.width, stage.height);
    }
    return c;
  };
}

async function capture(page, appId) {
  await page.goto(`${base}/tools/preview.html?char=${appId}&do=quirk:__none&frames=2`);
  await page.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
  return page.evaluate(async ({ IDLE_SECS, WALK_SECS, WAVE, FRAMES }) => {
    const P = window.wcPreview;
    document.querySelectorAll('#out, #controls, #bubble, #hearts').forEach((e) => e.remove());
    document.body.style.background = 'transparent';
    await vclock.advance(2); // settle into idle
    // Spidey swings in, and without real screen geometry the preview's swing
    // never lands: put it on its spot (what the app shows once it has landed).
    const stage = document.getElementById('stage');
    if (stage.style.visibility === 'hidden') { P.mover.stop(); P.mover.place(900); await vclock.advance(2); }
    const sets = {};
    const run = async (name, secs, n) => {
      const list = [];
      for (let i = 0; i < n; i++) { list.push(__grab()); await vclock.advance(secs / n); }
      sets[name] = list;
    };
    await run('idle', IDLE_SECS, FRAMES);
    // Wave: the notify reaction, last frame back near idle.
    P.play(WAVE);
    const wave = P.duration(WAVE) || 1.5, wl = [];
    for (let i = 0; i < FRAMES; i++) { wl.push(__grab()); await vclock.advance(wave / (FRAMES - 1)); }
    sets.wave = wl;
    await vclock.advance(1.5);
    // Walk: a trip to the right; the preview's box stays put, so it moves in place.
    P.mover.travel(5000);
    await vclock.advance(0.6);
    await run('walk', WALK_SECS, FRAMES);
    window.__sets = sets;
    // Bounds of everything drawn, relative to the window.
    const b = { l: 1e9, r: -1e9, t: 1e9, b: -1e9 };
    // Idle and wave only: Spidey's walk is a web swing whose thread runs off the top.
    for (const list of [sets.idle, sets.wave]) for (const c of list) {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 24) { if (x < b.l) b.l = x; if (x > b.r) b.r = x; if (y < b.t) b.t = y; if (y > b.b) b.b = y; }
      }
    }
    return b;
  }, { IDLE_SECS, WALK_SECS, WAVE, FRAMES });
}

async function encode(page, s, Q) {
  return page.evaluate(({ s, FOOT, SIZE, BASE, Q }) => {
    const draw = (src, g, ox) => {
      g.save();
      g.beginPath(); g.rect(ox, 0, SIZE, SIZE); g.clip();
      g.translate(ox + SIZE / 2, SIZE - BASE);
      g.scale(s, s);
      g.drawImage(src, -FOOT.x, -FOOT.y);
      g.restore();
    };
    const out = {};
    const one = document.createElement('canvas');
    one.width = one.height = SIZE;
    const og = one.getContext('2d'); og.imageSmoothingQuality = 'high';
    draw(__sets.idle[0], og, 0);
    out.still = one.toDataURL('image/webp', Q);
    for (const [k, list] of Object.entries(__sets)) {
      const c = document.createElement('canvas');
      c.width = SIZE * list.length; c.height = SIZE;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
      list.forEach((f, i) => draw(f, g, i * SIZE));
      out[k] = c.toDataURL('image/webp', Q);
    }
    return out;
  }, { s, FOOT, SIZE, BASE, Q });
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(init);
  const pages = {}, bounds = {};
  const ids = only.length ? only : Object.keys(CHARS);
  for (const id of ids) {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${id}] page error: ${e.message}`));
    bounds[id] = await capture(page, CHARS[id]);
    pages[id] = page;
    console.log(`${id} (${CHARS[id]}) bounds`, bounds[id]);
  }
  // One scale for all: the largest that keeps every frame of every character inside.
  // With a subset, WC_SCALE pins the scale of a full run.
  let s = Infinity;
  for (const b of Object.values(Object.keys(CHARS).length === ids.length ? bounds : {})) {
    if (b.r < b.l) throw new Error('A character rendered blank');
    s = Math.min(s, (SIZE - BASE - TOP) / (FOOT.y - b.t), (SIZE / 2 - SIDE) / Math.max(FOOT.x - b.l, b.r - FOOT.x));
  }
  if (process.env.WC_SCALE) s = Number(process.env.WC_SCALE);
  if (!Number.isFinite(s)) throw new Error('Rendering a subset needs WC_SCALE (printed by a full run)');
  console.log(`scale ${s.toFixed(4)} (WC_SCALE)`);
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const id of ids) {
    const o = await encode(pages[id], s, Q);
    for (const [k, url] of Object.entries(o)) {
      const file = path.join(OUT, k === 'still' ? `${id}.webp` : `${id}-${k}.webp`);
      const buf = Buffer.from(url.split(',')[1], 'base64');
      fs.writeFileSync(file, buf);
      total += buf.length;
    }
  }
  console.log(`wrote ${ids.length * 4} files, ${(total / 1024).toFixed(0)} KiB`);
  if (process.env.WC_CONTACT) {
    const page = pages[ids[0]];
    const files = ids.map((id) => ['', '-idle', '-walk', '-wave'].map((k) => 'data:image/webp;base64,' + fs.readFileSync(path.join(OUT, `${id}${k}.webp`)).toString('base64')));
    const png = await page.evaluate(async ({ files, SIZE }) => {
      const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
      const cols = 10, c = document.createElement('canvas');
      c.width = cols * (SIZE + 4); c.height = files.length * (SIZE + 4);
      const g = c.getContext('2d');
      g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
      for (let r = 0; r < files.length; r++) {
        const [still, ...strips] = await Promise.all(files[r].map(load));
        g.drawImage(still, 0, r * (SIZE + 4));
        let col = 1;
        for (const st of strips) for (const f of [0, 4, 8]) g.drawImage(st, f * SIZE, 0, SIZE, SIZE, (col++) * (SIZE + 4), r * (SIZE + 4), SIZE, SIZE);
      }
      return c.toDataURL('image/png');
    }, { files, SIZE });
    fs.mkdirSync(path.dirname(process.env.WC_CONTACT), { recursive: true });
    fs.writeFileSync(process.env.WC_CONTACT, Buffer.from(png.split(',')[1], 'base64'));
    console.log(`contact sheet ${process.env.WC_CONTACT}`);
  }
} finally {
  await browser.close();
  server.close();
}
