import type { PageItem } from '../types';
import { filterCss } from '../utils';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

  const rotated90 = page.rotation % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = rotated90 ? sh : sw;
  canvas.height = rotated90 ? sw : sh;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = filterCss(page.filter);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((page.rotation * Math.PI) / 180);
  ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', quality);
}

export async function bakeAllPages(pages: PageItem[], quality = 0.9): Promise<string[]> {
  const out: string[] = [];
  for (const p of pages) out.push(await bakePage(p, quality));
  return out;
}
