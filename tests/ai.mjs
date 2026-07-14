/**
 * Functional test for the AI tools (Summarize/Ask) WITHOUT the live backend:
 * intercepts the /api/kukpdf/ai/* calls to pdf.kuklabs.com and asserts the app
 * (a) extracts the PDF text and sends it, (b) renders the summary, and (c) shows
 * the Upgrade CTA on a 402. This verifies the client wiring; the real LLM is
 * covered by the backend PR.
 */
let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try { const m = await import(spec); chromium = m.chromium || m.default?.chromium; if (chromium) break; } catch {}
}
if (!chromium) { console.error('Playwright not found'); process.exit(2); }

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const exe = process.env.CHROMIUM || undefined;

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  // The mocked 402 is logged by the browser as a failed resource load — expected,
  // not an app error. Everything else counts.
  if (/Failed to load resource.*402/.test(t) || /status of 402/.test(t)) return;
  errors.push(t);
});
page.on('pageerror', (e) => errors.push(String(e)));
function fail(msg) { console.error('FAIL', msg); errors.length && console.error(errors.join('\n')); process.exit(1); }

// Capture what the app POSTs, and control the response per-test.
let sentBody = null;
let mode = 'ok'; // 'ok' | 'upgrade'
await ctx.route('**/api/kukpdf/ai/**', async (route) => {
  const url = route.request().url();
  if (url.includes('/quota')) {
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ signedIn: true, plan: 'free', limit: 3, used: 0, remaining: 3 }) });
  }
  if (url.includes('/summarize')) {
    sentBody = route.request().postDataJSON?.() || JSON.parse(route.request().postData() || '{}');
    if (mode === 'upgrade') {
      return route.fulfill({ status: 402, contentType: 'application/json',
        body: JSON.stringify({ error: 'AI tools need KukPDF Pro.', upgrade: true }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ summary: 'GIST: A test invoice.\n- Amount 4200\n- Due 2026-02-01' }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Seed a text PDF and a session token (Preferences-web stores under CapacitorStorage.*).
await page.evaluate(async () => {
  const { PDFDocument, StandardFonts } = await import('/node_modules/pdf-lib/dist/pdf-lib.esm.js');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([420, 595]);
  p.drawText('INVOICE Amount 4200 Due 2026-02-01', { x: 40, y: 500, size: 16, font });
  const blob = new Blob([await doc.save()], { type: 'application/pdf' });
  const { set } = await import('/node_modules/idb-keyval/dist/index.js');
  const id = 'test-ai-doc';
  await set('kukpdf:doc:' + id, { id, name: 'AiInvoice.pdf', kind: 'pdf', pages: [], createdAt: Date.now(), updatedAt: Date.now(), size: blob.size, blob });
  localStorage.setItem('CapacitorStorage.kuklabs:session-token', 'test-token-123');
});
await page.reload({ waitUntil: 'networkidle' });

// Open Tools → Summarize PDF → pick the doc.
await page.getByRole('button', { name: 'Tools' }).click().catch(() => {});
await page.waitForTimeout(300);
await page.getByText('Summarize PDF', { exact: true }).first().click();
await page.waitForTimeout(300);
await page.getByText('AiInvoice.pdf').first().click({ timeout: 4000 }).catch(() => fail('DocPicker did not show seeded PDF'));

// Panel should read the doc, then enable Summarize.
const sumBtn = page.getByRole('button', { name: /^Summarize$/ });
await sumBtn.waitFor({ timeout: 8000 }).catch(() => fail('Summarize button never appeared'));
await page.waitForTimeout(400);
await sumBtn.click();

// The mocked summary should render.
await page.getByText('GIST: A test invoice.', { exact: false }).waitFor({ timeout: 8000 })
  .catch(() => fail('summary did not render'));
if (!sentBody || !/INVOICE Amount 4200/.test(sentBody.text || '')) fail('extracted PDF text was not sent to /summarize');
console.log('PASS ai:summarize (text extracted + sent + summary rendered)');

// Upgrade path: switch the mock to 402 and summarize again.
mode = 'upgrade';
await page.getByRole('button', { name: /Summarize again/ }).click();
await page.getByRole('button', { name: /Upgrade to KukPDF Pro/ }).waitFor({ timeout: 8000 })
  .catch(() => fail('Upgrade CTA did not appear on 402'));
console.log('PASS ai:upgrade (402 shows Upgrade to Pro)');

console.log('CONSOLE ERRORS', errors.length);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
await browser.close();
