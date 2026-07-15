/**
 * Proves the new OCR languages load fully offline: blocks ALL non-localhost
 * network, seeds a PDF, opens Image to Text, verifies all languages appear, then
 * runs OCR in Tamil and asserts it completes (so tam.traineddata loaded from
 * /vendor, not a CDN).
 */
let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try { const m = await import(spec); chromium = m.chromium || m.default?.chromium; if (chromium) break; } catch {}
}
if (!chromium) { console.error('Playwright not found'); process.exit(2); }
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
function fail(m) { console.error('FAIL', m); errors.length && console.error(errors.join('\n')); process.exit(1); }

// Block anything not on localhost — if OCR tried a CDN it would fail here.
let offHost = null;
await ctx.route('**/*', (route) => {
  const u = new URL(route.request().url());
  if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
  offHost = u.hostname; return route.abort();
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const { PDFDocument, StandardFonts } = await import('/node_modules/pdf-lib/dist/pdf-lib.esm.js');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([420, 300]).drawText('Hello 12345', { x: 40, y: 200, size: 40, font });
  const blob = new Blob([await doc.save()], { type: 'application/pdf' });
  const { set } = await import('/node_modules/idb-keyval/dist/index.js');
  await set('kukpdf:doc:test-ocr', { id: 'test-ocr', name: 'OcrMe.pdf', kind: 'pdf', pages: [], createdAt: Date.now(), updatedAt: Date.now(), size: blob.size, blob });
});
await page.reload({ waitUntil: 'networkidle' });

await page.getByRole('button', { name: 'Tools' }).click().catch(() => {});
await page.waitForTimeout(300);
await page.getByText('Image to Text', { exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByText('OcrMe.pdf').first().click({ timeout: 4000 }).catch(() => fail('DocPicker did not show seeded PDF'));

// All six languages + the combo should be offered.
for (const label of ['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी']) {
  await page.getByRole('button', { name: label, exact: true }).first().waitFor({ timeout: 4000 })
    .catch(() => fail(`OCR language chip missing: ${label}`));
}
console.log('PASS ocr-langs: all six language chips present');

// Pick Tamil and run OCR — must complete offline.
await page.getByRole('button', { name: 'தமிழ்', exact: true }).first().click();
await page.getByRole('button', { name: /Run OCR/ }).click();
await page.getByRole('button', { name: /Copy text/ }).waitFor({ timeout: 90000 })
  .catch(() => fail('Tamil OCR did not complete offline (Copy text never appeared)'));
if (offHost && /tessdata|jsdelivr|unpkg|githubusercontent|naptha/.test(offHost)) fail(`OCR tried a CDN: ${offHost}`);
console.log('PASS ocr-langs: Tamil OCR completed fully offline (model loaded from /vendor)');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
await browser.close();
