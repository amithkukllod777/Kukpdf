import type { FilterKind } from './types';

export const filters: FilterKind[] = ['Original', 'Auto', 'B&W', 'Gray', 'Color', 'Contrast'];
export const modes = ['Document', 'ID Card', 'Book', 'Receipt', 'QR'] as const;

export function filterCss(f: FilterKind): string {
  if (f === 'Auto') return 'contrast(1.15) saturate(1.1) brightness(1.05)';
  if (f === 'B&W') return 'grayscale(1) contrast(1.7) brightness(1.08)';
  if (f === 'Gray') return 'grayscale(1) contrast(1.08)';
  if (f === 'Color') return 'saturate(1.35) contrast(1.05)';
  if (f === 'Contrast') return 'contrast(1.55) brightness(1.03)';
  return 'none';
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
