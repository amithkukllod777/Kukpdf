import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function sharePdf(blob: Blob, filename: string): Promise<void> {
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
}
