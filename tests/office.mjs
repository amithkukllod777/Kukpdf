/**
 * Functional test for PDF→Word/Excel (mocked backend): asserts the app sends the
 * PDF bytes to /api/pdf/pdf-to-office with the bearer token, renders a Download
 * result on success, and shows the Upgrade CTA on a 402 (Pro-gated).
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
page.on('console', (m) => { if (m.type() === 'error' && !/402|Failed to load resource/.test(m.text())) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
function fail(msg) { console.error('FAIL', msg); errors.length && console.error(errors.join('\n')); process.exit(1); }

let sentAuth = null, mode = 'ok';
await ctx.route('**/api/pdf/**', async (route) => {
  const url = route.request().url();
  if (url.includes('/office-quota')) {
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ signedIn: true, plan: 'premium', limit: 30, used: 0, remaining: 30 }) });
  }
  if (url.includes('/pdf-to-office')) {
    sentAuth = route.request().headers()['authorization'] || null;
    if (mode === 'upgrade') {
      return route.fulfill({ status: 402, contentType: 'application/json',
        body: JSON.stringify({ error: 'This tool needs KukPDF Premium.', upgrade: true }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: 'PK\x03\x04fake-docx-bytes' });
  }
  return route.fulfill({ status: 200, body: '{}' });
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const { PDFDocument, StandardFonts } = await import('/node_modules/pdf-lib/dist/pdf-lib.esm.js');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([420, 595]).drawText('Invoice 4200', { x: 40, y: 500, size: 16, font });
  const blob = new Blob([await doc.save()], { type: 'application/pdf' });
  const { set } = await import('/node_modules/idb-keyval/dist/index.js');
  await set('kukpdf:doc:test-office', { id: 'test-office', name: 'OfficeMe.pdf', kind: 'pdf', pages: [], createdAt: Date.now(), updatedAt: Date.now(), size: blob.size, blob });
  localStorage.setItem('CapacitorStorage.kuklabs:session-token', 'office-token-1');
});
await page.reload({ waitUntil: 'networkidle' });

// Tools → PDF to Word → pick doc
await page.getByRole('button', { name: 'Tools' }).click().catch(() => {});
await page.waitForTimeout(300);
await page.getByText('PDF to Word', { exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByText('OfficeMe.pdf').first().click({ timeout: 4000 }).catch(() => fail('DocPicker did not show seeded PDF'));

const convertBtn = page.getByRole('button', { name: /Convert to Word/ });
await convertBtn.waitFor({ timeout: 6000 }).catch(() => fail('Convert button never appeared'));
await convertBtn.click();

// Success → Download result
await page.getByRole('button', { name: /Download/ }).waitFor({ timeout: 8000 }).catch(() => fail('result Download did not render'));
if (!sentAuth || !/^Bearer /.test(sentAuth)) fail('bearer token was not sent to /pdf-to-office');
console.log('PASS office:convert (bearer sent + docx result rendered)');

// Upgrade path (402)
mode = 'upgrade';
await page.getByRole('button', { name: 'Close' }).click();
await page.waitForTimeout(200);
await page.getByText('PDF to Word', { exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByText('OfficeMe.pdf').first().click({ timeout: 4000 });
await page.getByRole('button', { name: /Convert to Word/ }).click();
await page.getByRole('button', { name: /Upgrade to KukPDF Pro/ }).waitFor({ timeout: 8000 })
  .catch(() => fail('Upgrade CTA did not appear on 402'));
console.log('PASS office:upgrade (402 shows Upgrade to Pro)');

console.log('CONSOLE ERRORS', errors.length);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
await browser.close();
