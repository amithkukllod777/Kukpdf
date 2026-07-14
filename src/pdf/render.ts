import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Loads a PDF and tags the resolved doc with its loading task so callers can free
 * worker resources via destroyPdfDoc(). Always clones the input bytes first: pdfjs
 * transfers (detaches) the ArrayBuffer it's given to its worker, so passing the same
 * buffer to loadPdfDoc twice (e.g. React StrictMode's double effect invocation in dev,
 * or any caller re-reading the same bytes) would otherwise throw "already detached".
 */
export async function loadPdfDoc(bytes: Uint8Array | ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  const data = bytes instanceof Uint8Array ? bytes.slice() : bytes.slice(0);
  const task = pdfjsLib.getDocument({ data });
  const doc = await task.promise;
  (doc as any).__loadingTask = task;
  return doc;
}

/** Like loadPdfDoc but supplies a password so pdfjs can open an encrypted PDF.
 *  Throws a pdfjs PasswordException (name === 'PasswordException') when the
 *  password is missing or wrong — callers surface a friendly message. */
export async function loadPdfDocWithPassword(bytes: Uint8Array | ArrayBuffer, password: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const data = bytes instanceof Uint8Array ? bytes.slice() : bytes.slice(0);
  const task = pdfjsLib.getDocument({ data, password });
  const doc = await task.promise;
  (doc as any).__loadingTask = task;
  return doc;
}

export async function destroyPdfDoc(doc: pdfjsLib.PDFDocumentProxy): Promise<void> {
  await (doc as any).__loadingTask?.destroy();
}

export async function renderPageToCanvas(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, scale = 1.5): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function renderPageToDataUrl(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, scale = 1.5, quality = 0.82): Promise<string> {
  const canvas = await renderPageToCanvas(pdf, pageNum, scale);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function pdfPageCount(bytes: Uint8Array | ArrayBuffer): Promise<number> {
  const pdf = await loadPdfDoc(bytes);
  const count = pdf.numPages;
  await destroyPdfDoc(pdf);
  return count;
}
