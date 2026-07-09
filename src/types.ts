export type Tab = 'home' | 'tools' | 'scan' | 'files' | 'profile';
export type ScanMode = 'Document' | 'ID Card' | 'Book' | 'Receipt' | 'QR';
export type FilterKind = 'Original' | 'Auto' | 'B&W' | 'Gray' | 'Color' | 'Contrast';

export interface PageItem {
  id: string;
  dataUrl: string;
  filter: FilterKind;
  rotation: number;
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
  size: number;
}
