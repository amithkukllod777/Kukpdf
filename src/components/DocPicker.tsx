import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';

export default function DocPicker({ docs, multiple, onPick, onCancel, title }: {
  docs: DocItem[];
  multiple?: boolean;
  onPick: (chosen: DocItem[]) => void;
  onCancel: () => void;
  title: string;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const selectable = docs.filter((d) => !d.trashed);
  const pdfDocs = selectable.filter((d) => !d.passwordProtected);
  const hiddenProtectedCount = selectable.length - pdfDocs.length;

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
