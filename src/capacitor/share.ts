import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { sanitizeFilename } from '../utils';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a file to the device. On native the anchor-`download` trick is a no-op
 * inside the WebView, so we write the bytes to the user-visible Documents folder
 * via Filesystem (falling back to the OS share/save sheet if that's blocked).
 * On web it does a normal browser download. Returns a short status for a toast.
 */
export async function saveFileToDevice(blob: Blob, rawFilename: string): Promise<string> {
  const filename = sanitizeFilename(rawFilename);
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    for (const directory of [Directory.Documents, Directory.External, Directory.Data] as const) {
      try {
        await Filesystem.writeFile({ path: filename, data: base64, directory, recursive: true });
        return `Saved to ${directory} · ${filename}`;
      } catch { /* try the next directory */ }
    }
    // Last resort: let the user save it via the system sheet.
    await sharePdf(blob, rawFilename);
    return 'Opened the share sheet — choose where to save.';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return `Downloaded ${filename}`;
}

export async function sharePdf(blob: Blob, rawFilename: string): Promise<void> {
  // Filesystem.writeFile treats "/" as a directory separator, so an unsanitized
  // name (e.g. one built from a locale date like "11/7/2026") silently fails to
  // write and the whole share action does nothing.
  const filename = sanitizeFilename(rawFilename);
  try {
    if (Capacitor.isNativePlatform()) {
      const base64 = await blobToBase64(blob);
      const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: filename, url: written.uri, dialogTitle: 'Share PDF' });
      return;
    }
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e: any) {
    // AbortError / "Share canceled" fires whenever the user just dismisses the
    // native share sheet — that's normal, not a failure, so stay silent for it.
    if (e?.name === 'AbortError' || /cancel/i.test(String(e?.message))) return;
    alert(`Couldn't share this file: ${e?.message || e}`);
  }
}
