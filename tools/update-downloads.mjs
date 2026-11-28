// Points the download page at the latest release of the app.
//   node tools/update-downloads.mjs [--check]
// Reads the latest GitHub release of APP_REPO (default Nidhishpp/work-companion),
// picks each platform's file, and rewrites the generated blocks in the pages:
//   <!-- dl:<platform> --> ... <!-- /dl:<platform> -->   download buttons
//   <!-- release --> ... <!-- /release -->              version, date, notes link
//   <span data-version>X.Y.Z</span>                      version number anywhere
// A file is only linked if an anonymous visitor can download it (checked with
// an unauthenticated request), so a private repo never produces dead links;
// missing platforms keep a "Coming soon" button. Run hourly by
// .github/workflows/downloads.yml, which commits any change. --check exits 1
// when the pages are out of date instead of writing. GITHUB_TOKEN, if set, is
// only used to read the release list (higher rate limit), never to check files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.APP_REPO || 'Nidhishpp/work-companion';
const EARLY = 'mailto:support@chaistack.in?subject=Work%20Companion%20early%20access';
const check = process.argv.includes('--check');

const PLATFORMS = {
  windows: { label: 'Download for Windows', main: /x64-setup\.exe$/i, extra: [['.msi installer', /\.msi$/i]] },
  mac: { label: 'Download for Mac', main: /universal\.dmg$/i, extra: [] },
  linux: { label: 'Download .AppImage', main: /\.AppImage$/i, extra: [['.deb', /\.deb$/i], ['.tar.gz', /\.tar\.gz$/i]] },
};

const headers = { accept: 'application/vnd.github+json', 'user-agent': 'work-companion-site' };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function latest() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers });
  if (r.status === 404) return null; // no release yet, or the repo is private
  if (!r.ok) throw new Error(`GitHub API ${r.status} for ${REPO}`);
  return r.json();
}

// True when a visitor without a GitHub account can download the file.
async function isPublic(url) {
  const r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'user-agent': 'work-companion-site' } });
  return r.ok;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mb = (n) => (n >= 100 * 1024 * 1024 ? Math.round(n / 1048576) : (n / 1048576).toFixed(1)) + ' MB';
const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function soon() {
  return `<div class="btn-row"><a class="btn btn-soon" href="${EARLY}">Coming soon · Get early access</a></div>`;
}

function block(p, assets) {
  const main = assets.find((a) => p.main.test(a.name));
  if (!main) return soon();
  const extras = p.extra.map(([label, re]) => [label, assets.find((a) => re.test(a.name))]).filter(([, a]) => a);
  let html = `<div class="btn-row"><a class="btn btn-primary" href="${esc(main.url)}" download>` +
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>${esc(p.label)}</a></div>` +
    `<p class="dl-meta">${esc(main.name.split('.').pop().toLowerCase() === 'appimage' ? 'AppImage' : '.' + main.name.split('.').pop())}, ${mb(main.size)}`;
  if (extras.length) html += ` · Also: ${extras.map(([label, a]) => `<a href="${esc(a.url)}" download>${esc(label)}</a> (${mb(a.size)})`).join(', ')}`;
  return html + '</p>';
}

function releaseBlock(rel) {
  if (!rel) return `<p class="muted">Public downloads open soon. For early access, email <a href="${EARLY}">support@chaistack.in</a>.</p>`;
  return `<p class="muted">Released ${date(rel.published_at)}. <a href="${esc(rel.html_url)}">What’s new in ${esc(rel.version)}</a></p>`;
}

function replaceBlock(s, name, html) {
  const re = new RegExp(`(<!-- ${name} -->)[\\s\\S]*?(<!-- /${name} -->)`);
  if (!re.test(s)) throw new Error(`marker ${name} not found`);
  return s.replace(re, `$1${html}$2`);
}

const rel = await latest();
let assets = [];
let release = null;
if (rel && !rel.draft && !rel.prerelease) {
  const all = rel.assets.map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url }));
  for (const a of all) if (await isPublic(a.url)) assets.push(a);
  if (assets.length) release = { version: rel.tag_name.replace(/^v/, ''), published_at: rel.published_at, html_url: rel.html_url };
  console.log(`${REPO} ${rel.tag_name}: ${assets.length}/${all.length} files public`);
} else {
  console.log(`${REPO}: no public release found; keeping "Coming soon"`);
}

let changed = false;
for (const file of fs.readdirSync(site).filter((f) => f.endsWith('.html'))) {
  const full = path.join(site, file);
  const before = fs.readFileSync(full, 'utf8');
  const crlf = before.includes('\r\n');
  let s = before.replace(/\r\n/g, '\n');
  if (s.includes('<!-- dl:')) {
    for (const [id, p] of Object.entries(PLATFORMS)) s = replaceBlock(s, `dl:${id}`, block(p, release ? assets : []));
  }
  if (s.includes('<!-- release -->')) s = replaceBlock(s, 'release', releaseBlock(release));
  if (release) s = s.replace(/<span data-version>[^<]*<\/span>/g, `<span data-version>${esc(release.version)}</span>`);
  if (crlf) s = s.replace(/\n/g, '\r\n');
  if (s !== before) {
    changed = true;
    if (check) console.error(`${file} is out of date`);
    else { fs.writeFileSync(full, s); console.log(`updated ${file}`); }
  }
}
if (check && changed) process.exit(1);
if (!changed) console.log('download links are up to date');
