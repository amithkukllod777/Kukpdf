export type Tab = 'home' | 'tools' | 'scan' | 'files' | 'profile';
export type ScanMode = 'Document' | 'ID Card' | 'Book' | 'Receipt' | 'QR';
export type FilterKind = 'Original' | 'Auto' | 'B&W' | 'Gray' | 'Color' | 'Contrast';

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageItem {
  id: string;
  dataUrl: string;
  filter: FilterKind;
  rotation: number;
  crop?: CropRect;
}

export interface DocItem {
  id: string;
  name: string;
  kind: 'scan' | 'pdf' | 'image';
  pages: PageItem[];
  createdAt: number;
  favorite?: boolean;
  secure?: boolean;
  trashed?: boolean;
  /** Encrypted via the Password Protect tool. Plain pdf-lib (used by every other
   * tool here) and pdfjs's in-app viewer both refuse to read encrypted content
   * without a decrypt path we don't have, so these are excluded from every other
   * tool's document picker rather than crashing or silently corrupting output. */
  passwordProtected?: boolean;
  size: number;
  blob: Blob;
  ocrText?: string;
}

export interface SignatureItem {
  id: string;
  dataUrl: string;
  createdAt: number;
}
