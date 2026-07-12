import type { PageItem } from '../types';
import { filterCss } from '../utils';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Longest edge a baked page is allowed to reach. Full-resolution camera/scanner
 * photos can be 4000px+ on the long edge; baking several of those at native size
 * into same-sized canvases (held as base64 data URLs) is what was crashing the
 * WebView on real devices during multi-page PDF export. 2200px is still sharp
 * for a scanned document at print resolution but keeps memory/CPU bounded.
 */
export const MAX_DIM = 2200;

/** Downscales an arbitrary image data URL to fit within MAX_DIM, re-encoded as JPEG. */
export async function capImageDataUrl(dataUrl: string, maxDim = MAX_DIM, quality = 0.9): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Renders a page's rotation, crop and filter into a flat JPEG data URL,
 * so exported/edited PDFs match what the user actually sees in the editor.
 */
export async function bakePage(page: PageItem, quality = 0.9): Promise<string> {
  const img = await loadImage(page.dataUrl);
  const crop = page.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const sx = crop.x * img.width;
  const sy = crop.y * img.height;
  const sw = crop.w * img.width;
  const sh = crop.h * img.height;

  const scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
  const dw = sw * scale;
  const dh = sh * scale;

  const rotated90 = page.rotation % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = rotated90 ? dh : dw;
  canvas.height = rotated90 ? dw : dh;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = filterCss(page.filter);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((page.rotation * Math.PI) / 180);
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', quality);
}

export async function bakeAllPages(pages: PageItem[], quality = 0.9): Promise<string[]> {
  const out: string[] = [];
  for (const p of pages) out.push(await bakePage(p, quality));
  return out;
}
