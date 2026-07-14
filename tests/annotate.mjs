/**
 * Functional test for Annotate: seed a real multi-page PDF into IndexedDB, open
 * the Annotate tool, wait for the editor to render page backgrounds, draw a
 * stroke, save, and assert a new "(annotated)" document lands in the store.
 */
let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try { const m = await import(spec); chromium = m.chromium || m.default?.chromium; if (chromium) break; } catch {}
}
if (!chromium) { console.error('Playwright not found'); process.exit(2); }

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const exe = process.env.CHROMIUM || undefined;

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newContext({ viewport: { width: 390, height: 780 } }).then((c) => c.newPage());
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

function fail(msg) { console.error('FAIL', msg); errors.length && console.error(errors.join('\n')); process.exit(1); }

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Build a real 2-page PDF with pdf-lib (already bundled) and store it as a DocItem.
const created = await page.evaluate(async () => {
  const { PDFDocument, StandardFonts } = await import('/node_modules/pdf-lib/dist/pdf-lib.esm.js');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of ['Page one', 'Page two']) {
    const p = doc.addPage([420, 595]);
    p.drawText(t, { x: 60, y: 500, size: 32, font });
  }
  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const { set } = await import('/node_modules/idb-keyval/dist/index.js');
  const id = 'test-annotate-doc';
  const item = {
    id, name: 'AnnotateMe.pdf', kind: 'pdf', pages: [],
    createdAt: Date.now(), updatedAt: Date.now(), size: blob.size,
    favorite: false, blob,
  };
  await set('kukpdf:doc:' + id, item);   // each doc is its own key; blob is inline
  return item.name;
});
if (!created) fail('could not seed PDF');

await page.reload({ waitUntil: 'networkidle' });

// Open Tools → Annotate
await page.getByRole('button', { name: 'Tools' }).click().catch(() => {});
await page.waitForTimeout(300);
const annotateBtn = page.getByText('Annotate', { exact: true }).first();
await annotateBtn.click();
await page.waitForTimeout(400);

// Pick the seeded doc in DocPicker
const pickTarget = page.getByText('AnnotateMe.pdf').first();
await pickTarget.click({ timeout: 4000 }).catch(() => fail('DocPicker did not show seeded PDF'));

// Confirm pick (DocPicker has a Continue/Use button, else auto-advances)
const useBtn = page.getByRole('button', { name: /use|continue|next|select/i }).first();
if (await useBtn.isVisible().catch(() => false)) await useBtn.click().catch(() => {});

// Wait for AnnotateEditor to finish rendering pages (canvas appears)
await page.waitForSelector('canvas.annotate-canvas', { timeout: 15000 }).catch(() => fail('Annotate editor canvas never rendered'));
await page.waitForTimeout(500);

// Draw a stroke on the canvas
const box = await page.locator('canvas.annotate-canvas').boundingBox();
if (!box) fail('no canvas box');
await page.mouse.move(box.x + 40, box.y + 40);
await page.mouse.down();
await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 });
await page.mouse.move(box.x + 200, box.y + 60, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(200);

// Save
const saveBtn = page.getByRole('button', { name: /save annotated pdf/i });
if (await saveBtn.isDisabled().catch(() => true)) fail('Save button stayed disabled after drawing');
await saveBtn.click();

// Wait for the new document to appear in the store
await page.waitForFunction(async () => {
  const { keys, get } = await import('/node_modules/idb-keyval/dist/index.js');
  const all = await keys();
  const docKeys = all.filter((k) => typeof k === 'string' && k.startsWith('kukpdf:doc:'));
  const docs = await Promise.all(docKeys.map((k) => get(k)));
  return docs.some((d) => d && /\(annotated\)/i.test(d.name));
}, { timeout: 20000 }).catch(() => fail('annotated PDF was not saved to the store'));

console.log('PASS annotate: editor rendered, stroke drawn, annotated PDF saved');
console.log('CONSOLE ERRORS', errors.length);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
await browser.close();
