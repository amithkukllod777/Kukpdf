import { Capacitor } from '@capacitor/core';
import { DocumentScanner } from '@capacitor-mlkit/document-scanner';

/**
 * Wraps Google's ML Kit Document Scanner (the same scanner used in Google Drive):
 * real live camera preview, automatic edge/boundary detection, auto-crop,
 * perspective correction, filters and multi-page capture, all native — no
 * custom Kotlin/CameraX code needed. Android only; falls back to the plain
 * camera capture flow everywhere else (web, iOS, or if the on-device Google
 * Play services module isn't installed yet).
 */
export async function isNativeScannerAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return false;
  try {
    const { available } = await DocumentScanner.isGoogleDocumentScannerModuleAvailable();
    return available;
  } catch {
    return false;
  }
}

async function uriToDataUrl(uri: string): Promise<string> {
  const webUri = Capacitor.convertFileSrc(uri);
  const res = await fetch(webUri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Launches the native scanner UI. Returns the captured page images as data
 * URLs (already auto-cropped/enhanced by Google's scanner), or null if the
 * user cancelled.
 */
export async function scanWithNativeScanner(pageLimit = 20): Promise<string[] | null> {
  try {
    const result = await DocumentScanner.scanDocument({
      galleryImportAllowed: true,
      pageLimit,
      resultFormats: 'JPEG',
      scannerMode: 'FULL',
    });
    if (!result.scannedImages?.length) return null;
    return Promise.all(result.scannedImages.map(uriToDataUrl));
  } catch {
    return null; // user cancelled or the module isn't installed
  }
}

/** Kicks off the on-device install of the Google Document Scanner module (first-run only, ~a few MB). */
export async function installNativeScannerModule(onProgress?: (pct: number) => void): Promise<void> {
  const handle = await DocumentScanner.addListener('googleDocumentScannerModuleInstallProgress', (e) => {
    if (typeof e.progress === 'number') onProgress?.(e.progress);
  });
  try {
    await DocumentScanner.installGoogleDocumentScannerModule();
  } finally {
    await handle.remove();
  }
}
