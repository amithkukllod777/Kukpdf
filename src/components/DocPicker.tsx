import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';

export default function DocPicker({ docs, multiple, onPick, onCancel, title, onImportPdf, includeProtected }: {
  docs: DocItem[];
  multiple?: boolean;
  onPick: (chosen: DocItem[]) => void;
  onCancel: () => void;
  title: string;
  onImportPdf?: (file: File) => Promise<DocItem>;
  /** Unlock PDF needs the encrypted docs shown (they're the whole point). */
  includeProtected?: boolean;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const selectable = docs.filter((d) => !d.trashed);
  const pdfDocs = includeProtected ? selectable : selectable.filter((d) => !d.passwordProtected);
  const hiddenProtectedCount = includeProtected ? 0 : selectable.length - pdfDocs.length;

  async function handleImport(file: File | undefined) {
    if (!file || !onImportPdf) return;
    setImporting(true);
    try {
      await onImportPdf(file);
    } finally {
      setImporting(false);
    }
  }

  function toggle(id: string) {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="modal">
      <div className="sheet">
        <h2>{title}</h2>
        {pdfDocs.length === 0 && <p className="viewer-status">No documents yet — scan or import one first.</p>}
        {hiddenProtectedCount > 0 && (
          <p className="viewer-status">
            {hiddenProtectedCount} password-protected {hiddenProtectedCount === 1 ? 'file is' : 'files are'} hidden here — tools can't open encrypted PDFs.
          </p>
        )}
        <div className="list">
          {pdfDocs.map((d) =>
            multiple ? (
              <label key={d.id} className="setting">
                <span>{d.name}</span>
                <input type="checkbox" checked={ids.includes(d.id)} onChange={() => toggle(d.id)} />
              </label>
            ) : (
              <button key={d.id} className="file picker-row" onClick={() => onPick([d])}>
                <FileText />
                <div>
                  <b>{d.name}</b>
                  <p>{formatBytes(d.size)} · {d.pages.length || '?'} pages</p>
                </div>
              </button>
            )
          )}
        </div>
        {onImportPdf && (
          <>
            <button className="primary wide" disabled={importing} onClick={() => importRef.current?.click()}>
              <Upload size={16} /> {importing ? 'Importing…' : 'Import a PDF file'}
            </button>
            <input
              ref={importRef}
              hidden
              type="file"
              accept="application/pdf"
              onChange={(e) => { handleImport(e.target.files?.[0]); e.target.value = ''; }}
            />
          </>
        )}
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          {multiple && (
            <button disabled={ids.length < 2} onClick={() => onPick(pdfDocs.filter((d) => ids.includes(d.id)))}>
              Use {ids.length} files
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
