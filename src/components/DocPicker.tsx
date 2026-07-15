import { useEffect, useRef, useState } from 'react';
import { Check, Upload } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';
import { loadPdfDoc, renderPageToDataUrl, destroyPdfDoc } from '../pdf/render';

// Cache first-page thumbnail + page count per doc id so re-opening the picker
// doesn't re-rasterize the same PDFs.
const cache = new Map<string, { url: string | null; pages: number }>();

/** A picker row with a real first-page thumbnail, page count, and (in multi mode)
 * a compact check — replacing the old oversized bare checkbox with no preview. */
function PickerRow({ d, selected, multiple, onClick }: {
  d: DocItem; selected: boolean; multiple: boolean; onClick: () => void;
}) {
  const seeded = cache.get(d.id);
  const [thumb, setThumb] = useState<string | null>(d.pages[0]?.dataUrl ?? seeded?.url ?? null);
  const [pages, setPages] = useState<number | null>(d.pages.length || seeded?.pages || null);

  useEffect(() => {
    if ((thumb && pages) || d.passwordProtected) return;
    let alive = true;
    (async () => {
      try {
        const bytes = new Uint8Array(await d.blob.arrayBuffer());
        const doc = await loadPdfDoc(bytes);
        const n = doc.numPages;
        const url = thumb ?? await renderPageToDataUrl(doc, 1, 0.4, 0.6);
        await destroyPdfDoc(doc);
        if (alive) { cache.set(d.id, { url, pages: n }); setThumb(url); setPages(n); }
      } catch { if (alive) setPages(d.pages.length || 0); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.id]);

  return (
    <button className={`file picker-row${selected ? ' sel' : ''}`} onClick={onClick}>
      {thumb ? (
        <img className="file-thumb-img" src={thumb} alt="" />
      ) : (
        <div className="file-thumb pdf"><span>PDF</span></div>
      )}
      <div className="picker-meta">
        <b>{d.name}</b>
        <p>{formatBytes(d.size)}{pages ? ` · ${pages} page${pages > 1 ? 's' : ''}` : ''}</p>
      </div>
      {multiple && <span className={`pick-check${selected ? ' on' : ''}`}>{selected && <Check size={16} />}</span>}
    </button>
  );
}

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
          {pdfDocs.map((d) => (
            <PickerRow
              key={d.id}
              d={d}
              multiple={!!multiple}
              selected={ids.includes(d.id)}
              onClick={() => (multiple ? toggle(d.id) : onPick([d]))}
            />
          ))}
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
