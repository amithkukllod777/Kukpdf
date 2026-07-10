import { PDFDocument } from 'pdf-lib';
import type { PageItem } from '../types';
import { bakeAllPages } from './bake';

const A4_PT = { w: 595.28, h: 841.89 };

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Builds a multi-page PDF from scanned pages, baking rotation/crop/filter into each image first. */
export async function pagesToPdf(pages: PageItem[]): Promise<Blob> {
  const baked = await bakeAllPages(pages);
  const doc = await PDFDocument.create();
  for (const dataUrl of baked) {
    const bytes = dataUrlToBytes(dataUrl);
    const jpg = await doc.embedJpg(bytes);
    const ratio = Math.min(A4_PT.w / jpg.width, A4_PT.h / jpg.height);
    const w = jpg.width * ratio;
    const h = jpg.height * ratio;
    const page = doc.addPage([A4_PT.w, A4_PT.h]);
    page.drawImage(jpg, { x: (A4_PT.w - w) / 2, y: (A4_PT.h - h) / 2, width: w, height: h });
  }
  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}
