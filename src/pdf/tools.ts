import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { renderPageToDataUrl, loadPdfDoc, destroyPdfDoc } from './render';
import { ocrImageWithWords, type OcrLang } from '../ocr';

export async function fileOrBlobToBytes(input: Blob): Promise<Uint8Array> {
  return new Uint8Array(await input.arrayBuffer());
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const bytes of files) {
    const src = await PDFDocument.load(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/** Extracts the given 0-based page indices into a new PDF. */
export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

/** Splits a PDF into one file per page, returned in order. */
export async function splitAllPages(bytes: Uint8Array): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(bytes);
  const count = src.getPageCount();
  const results: Uint8Array[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await extractPages(bytes, [i]));
  }
  return results;
}

export async function deletePages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const remove = new Set(indices);
  const keep = src.getPageIndices().filter((i) => !remove.has(i));
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keep);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export async function reorderPages(bytes: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, newOrder);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

export async function duplicatePage(bytes: Uint8Array, index: number): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const order = src.getPageIndices();
  order.splice(index + 1, 0, index);
  return reorderPages(bytes, order);
}

export async function insertBlankPage(bytes: Uint8Array, atIndex: number): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const size = src.getPageCount() > 0 ? src.getPage(Math.min(atIndex, src.getPageCount() - 1)).getSize() : { width: 595.28, height: 841.89 };
  src.insertPage(atIndex, [size.width, size.height]);
  return src.save();
}

export async function rotatePage(bytes: Uint8Array, index: number, degreesDelta: number): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const page = src.getPage(index);
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + degreesDelta) % 360));
  return src.save();
}

export async function rotateAllPages(bytes: Uint8Array, degreesDelta: number): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  src.getPages().forEach((page) => {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + degreesDelta) % 360));
  });
  return src.save();
}

export async function addWatermarkText(bytes: Uint8Array, text: string, opacity = 0.25): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 8;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.45, 0.1, 0.85),
      opacity,
      rotate: degrees(-35),
    });
  }
  return doc.save();
}

export async function addPageNumbers(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const label = `${i + 1} / ${pages.length}`;
    const textWidth = font.widthOfTextAtSize(label, 10);
    page.drawText(label, { x: width / 2 - textWidth / 2, y: 20, size: 10, font, color: rgb(0.3, 0.3, 0.35) });
  });
  return doc.save();
}

/**
 * "Compress" by rasterizing each page at a reduced scale and re-encoding as JPEG.
 * Real, working size reduction for scanned/photo PDFs; not suited to text PDFs
 * (it flattens text to an image, so it is offered as a distinct, clearly-labelled tool).
 */
export async function compressScannedPdf(bytes: Uint8Array, level: 'low' | 'recommended' | 'high' = 'recommended'): Promise<Uint8Array> {
  const settings = { low: { scale: 1.6, quality: 0.85 }, recommended: { scale: 1.15, quality: 0.65 }, high: { scale: 0.85, quality: 0.45 } }[level];
  const pdfjsDoc = await loadPdfDoc(bytes);
  const count = pdfjsDoc.numPages;
  const out = await PDFDocument.create();
  for (let i = 1; i <= count; i++) {
    const dataUrl = await renderPageToDataUrl(pdfjsDoc, i, settings.scale, settings.quality);
    const jpg = await out.embedJpg(dataUrlToBytes(dataUrl));
    const page = out.addPage([jpg.width, jpg.height]);
    page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });
  }
  await destroyPdfDoc(pdfjsDoc);
  return out.save();
}

export async function stampImage(bytes: Uint8Array, pageIndex: number, pngDataUrl: string, xRatio: number, yRatio: number, wRatio: number, hRatio: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const { width, height } = page.getSize();
  const png = await doc.embedPng(dataUrlToBytes(pngDataUrl));
  const w = wRatio * width;
  const h = hRatio * height;
  page.drawImage(png, { x: xRatio * width, y: height - yRatio * height - h, width: w, height: h });
  return doc.save();
}

export function bytesToBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Best-effort repair: reparses with lenient options (ignores bad xref/object
 * errors where possible) and re-saves a clean copy. This fixes some corrupt
 * or non-standard PDFs but is not a guaranteed recovery tool.
 */
export async function repairPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false });
  return doc.save();
}

/**
 * Builds a searchable PDF: each page becomes a full-page JPEG (so it still looks
 * like the original scan) with an invisible OCR text layer placed over each
 * recognised word so the text can be selected, copied and searched.
 */
export async function buildSearchablePdf(
  bytes: Uint8Array,
  lang: OcrLang,
  onProgress?: (page: number, total: number, pct: number) => void
): Promise<Uint8Array> {
  const pdfjsDoc = await loadPdfDoc(bytes);
  const count = pdfjsDoc.numPages;
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const dataUrl = await renderPageToDataUrl(pdfjsDoc, i, 1.6, 0.75);
    const ocr = await ocrImageWithWords(dataUrl, lang, (pct) => onProgress?.(i, count, pct));
    const jpg = await out.embedJpg(dataUrlToBytes(dataUrl));
    const page = out.addPage([jpg.width, jpg.height]);
    page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });
    const scaleX = jpg.width / ocr.imageWidth;
    const scaleY = jpg.height / ocr.imageHeight;
    for (const word of ocr.words) {
      if (!word.text.trim()) continue;
      const x0 = word.bbox.x0 * scaleX;
      const y0 = word.bbox.y0 * scaleY;
      const y1 = word.bbox.y1 * scaleY;
      const boxH = Math.max(1, y1 - y0);
      const fontSize = boxH * 0.85;
      page.drawText(word.text, {
        x: x0,
        y: jpg.height - y1,
        size: fontSize,
        font,
        opacity: 0,
        color: rgb(0, 0, 0),
      });
    }
  }
  await destroyPdfDoc(pdfjsDoc);
  return out.save();
}
