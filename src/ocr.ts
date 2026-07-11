import { createWorker } from 'tesseract.js';

export type OcrLang = 'eng' | 'hin' | 'eng+hin';

// The OCR engine (worker script, WASM core, and English + Hindi traineddata —
// the two languages this app targets) is vendored locally under public/vendor
// so OCR works fully offline, on first launch, with no CDN dependency at all.
const WORKER_OPTIONS = {
  workerPath: '/vendor/tesseract/worker.min.js',
  corePath: '/vendor/tesseract/',
  langPath: '/vendor/tesseract-lang',
};

/** Runs OCR on an image data URL entirely on-device via tesseract.js (WASM). */
export async function ocrImage(dataUrl: string, lang: OcrLang = 'eng', onProgress?: (pct: number) => void): Promise<string> {
  const worker = await createWorker(lang, undefined, {
    ...WORKER_OPTIONS,
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrResult {
  text: string;
  words: OcrWord[];
  imageWidth: number;
  imageHeight: number;
}

/** Runs OCR and also returns per-word bounding boxes, used to build a searchable text layer. */
export async function ocrImageWithWords(dataUrl: string, lang: OcrLang = 'eng', onProgress?: (pct: number) => void): Promise<OcrResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const worker = await createWorker(lang, undefined, {
    ...WORKER_OPTIONS,
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(dataUrl, {}, { blocks: true });
    const words: OcrWord[] = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((p) => p.lines)
      .flatMap((l) => l.words)
      .map((w) => ({ text: w.text, bbox: w.bbox }));
    return { text: data.text, words, imageWidth: img.naturalWidth, imageHeight: img.naturalHeight };
  } finally {
    await worker.terminate();
  }
}
