/**
 * KukPDF smoke test — boots the web build, visits every tab, opens every tool,
 * and asserts the login screen fits one screen with no console errors/crashes.
 *
 * Run:
 *   npm run dev            # in one terminal (serves http://localhost:5183)
 *   node tests/smoke.mjs   # in another
 *
 * Requires Playwright. Point CHROMIUM at a Chromium binary if the default
 * playwright install isn't present:
 *   CHROMIUM=/path/to/chrome node tests/smoke.mjs
 * Override the base URL with BASE_URL (default http://localhost:5183).
 */
// Resolve Playwright from the local install if present, else fall back to the
// global one (dev sandboxes ship it at /opt/node22/lib/node_modules). ESM does
// not honour NODE_PATH, so we try a sequence of specifiers explicitly.
let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try {
    const m = await import(spec);
    chromium = m.chromium || m.default?.chromium;   // named (ESM) or default (CJS interop)
    if (chromium) break;
  } catch { /* try next */ }
}
if (!chromium) { console.error('Playwright not found (local or /opt/node22).'); process.exit(2); }

const BASE_URL = process.env.BASE_URL || 'http://localhost:5183';
const exe = process.env.CHROMIUM || undefined; // undefined → playwright's bundled Chromium

const TOOLS = [
  'Scan to PDF', 'Image to PDF', 'JPG to PDF', 'Merge PDF', 'Split PDF', 'Rotate PDF',
  'Delete Pages', 'Reorder Pages', 'Compress PDF', 'Repair PDF', 'Sign PDF', 'Watermark',
  'Page Numbers', 'Annotate', 'Image to Text', 'Searchable PDF', 'Summarize PDF', 'Ask PDF',
  'Password Protect', 'Unlock PDF', 'Secure Folder',
];

const results = [];
const log = (t, ok, note = '') => { results.push({ t, ok, note }); };

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
// seed a minimal PDF so pickers have something to show
await page.evaluate(async () => {
  const { set } = await import('/node_modules/idb-keyval/dist/index.js');
  const bytes = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Resources<<>>>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
  const blob = new Blob([bytes], { type: 'application/pdf' });
  await set('kukpdf:doc:smoke1', { id: 'smoke1', name: 'Smoke Test.pdf', kind: 'pdf', pages: [], createdAt: Date.now(), size: blob.size, blob });
});
await page.reload({ waitUntil: 'networkidle' });

for (const tab of ['Home', 'Tools', 'Files', 'Profile']) {
  const before = errs.length;
  await page.locator('nav.bottom button').filter({ hasText: tab }).first().click();
  await page.waitForTimeout(300);
  log('tab:' + tab, errs.length === before, errs.slice(before).join('; '));
}

for (const tool of TOOLS) {
  const before = errs.length;
  await page.locator('nav.bottom button').filter({ hasText: 'Tools' }).first().click();
  await page.waitForTimeout(150);
  const card = page.locator('.tool', { hasText: new RegExp('^' + tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first();
  if (!(await card.count())) { log('tool:' + tool, false, 'card not found'); continue; }
  await card.click();
  await page.waitForTimeout(450);
  const opened = (await page.locator('.modal .sheet').count()) > 0
    || (await page.locator('.scan-hero, .scan-status-mini').count()) > 0
    || tool === 'Secure Folder';
  log('tool:' + tool, opened && errs.length === before, errs.slice(before).join('; '));
  const cancel = page.getByRole('button', { name: /^(Cancel|Close)$/ }).first();
  if (await cancel.count()) { await cancel.click().catch(() => {}); await page.waitForTimeout(120); }
}

await page.locator('nav.bottom button').filter({ hasText: 'Profile' }).first().click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: /sign in/i }).first().click();
await page.waitForTimeout(450);
const fit = await page.evaluate(() => {
  const el = document.querySelector('.auth');
  return { overflow: el.scrollHeight - el.clientHeight };
});
log('login:opens', (await page.locator('.auth-primary').count()) > 0);
log('login:fits(no-scroll)', fit.overflow <= 2, `overflow ${fit.overflow}px`);

const fails = results.filter((r) => !r.ok);
for (const r of results) console.log((r.ok ? 'PASS' : 'FAIL') + ' ' + r.t + (r.note ? '  <' + r.note + '>' : ''));
console.log(`\nTOTAL ${results.length} | FAILS ${fails.length} | CONSOLE ERRORS ${errs.length}`);
await browser.close();
process.exit(fails.length === 0 && errs.length === 0 ? 0 : 1);
