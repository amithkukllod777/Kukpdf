import { createWorker } from 'tesseract.js';

// Supported OCR languages — all traineddata is vendored under
// public/vendor/tesseract-lang so every one works fully offline (the India-first
// moat). `+` combines models (e.g. English + a script) in one pass.
export const OCR_LANGS = [
  { code: 'eng', label: 'English' },
  { code: 'hin', label: 'हिन्दी' },
  { code: 'tam', label: 'தமிழ்' },
  { code: 'tel', label: 'తెలుగు' },
  { code: 'ben', label: 'বাংলা' },
  { code: 'mar', label: 'मराठी' },
  { code: 'eng+hin', label: 'Eng + हिन्दी' },
] as const;

export type OcrLang = (typeof OCR_LANGS)[number]['code'];

// The OCR engine (worker script, WASM core, and the vendored traineddata for
// English, Hindi, Tamil, Telugu, Bengali and Marathi) lives under public/vendor
// so OCR works fully offline, on first launch, with no CDN dependency at all.
const WORKER_OPTIONS = {
  workerPath: '/vendor/tesseract/worker.min.js',
  corePath: '/vendor/tesseract/',
  langPath: '/vendor/tesseract-lang',
  // The traineddata is vendored UNCOMPRESSED (.traineddata, not .gz): Android's
  // asset packaging silently gunzips + strips the .gz from bundled files, so a
  // gzip request 404s on device and OCR hangs. gzip:false makes tesseract.js
  // fetch the plain .traineddata that's actually in the bundle. (cacheMethod
  // 'none' avoids IndexedDB caching a file we already ship offline.)
  gzip: false,
  cacheMethod: 'none' as const,
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
