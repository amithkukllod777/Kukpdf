import { Capacitor } from '@capacitor/core';
import { DocumentScanner as MlkitScanner } from '@capacitor-mlkit/document-scanner';
import { DocumentScanner as VisionKitScanner } from 'capacitor-ios-docscan';

/**
 * Native "auto-scan" (live edge detection, auto-crop, perspective correction,
 * multi-page) on BOTH platforms:
 *   • Android → Google ML Kit Document Scanner (the scanner Google Drive uses).
 *   • iOS     → Apple VisionKit (`VNDocumentCameraViewController`, the Notes/Files
 *               scanner) via the local `capacitor-ios-docscan` plugin.
 * Everywhere else (web) it falls back to plain camera capture.
 */
const platform = () => Capacitor.getPlatform();

export async function isNativeScannerAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    if (platform() === 'android') {
      const { available } = await MlkitScanner.isGoogleDocumentScannerModuleAvailable();
      return available;
    }
    if (platform() === 'ios') {
      // VisionKit is built into iOS — no module download. isAvailable() is true on
      // real hardware, false on the simulator (VNDocumentCameraViewController.isSupported).
      const { available } = await VisionKitScanner.isAvailable();
      return available;
    }
  } catch {
    return false;
  }
  return false;
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
 * URLs (already auto-cropped/enhanced), or null if the user cancelled.
 */
export async function scanWithNativeScanner(pageLimit = 20): Promise<string[] | null> {
  try {
    let uris: string[] = [];
    if (platform() === 'android') {
      const result = await MlkitScanner.scanDocument({
        galleryImportAllowed: true,
        pageLimit,
        resultFormats: 'JPEG',
        scannerMode: 'FULL',
      });
      uris = result.scannedImages ?? [];
    } else if (platform() === 'ios') {
      const result = await VisionKitScanner.scan();
      uris = result.scannedImages ?? [];
    }
    if (!uris.length) return null;
    return Promise.all(uris.map(uriToDataUrl));
  } catch {
    return null; // user cancelled or the scanner is unavailable
  }
}

/**
 * Kicks off the on-device install of the Google Document Scanner module
 * (Android first-run only, ~a few MB). iOS VisionKit needs no install, so this
 * is a no-op there.
 */
export async function installNativeScannerModule(onProgress?: (pct: number) => void): Promise<void> {
  if (platform() !== 'android') return;
  const handle = await MlkitScanner.addListener('googleDocumentScannerModuleInstallProgress', (e) => {
    if (typeof e.progress === 'number') onProgress?.(e.progress);
  });
  try {
    await MlkitScanner.installGoogleDocumentScannerModule();
  } finally {
    await handle.remove();
  }
}
