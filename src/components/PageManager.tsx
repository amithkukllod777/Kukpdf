import { useEffect, useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Copy, FilePlus2, MoveLeft, MoveRight, RotateCw, Trash2 } from 'lucide-react';
import { destroyPdfDoc, loadPdfDoc, renderPageToDataUrl } from '../pdf/render';

interface Cell {
  id: string;
  kind: 'page' | 'blank';
  srcIndex?: number;
  dataUrl?: string;
  rotation: number;
}

export default function PageManager({ bytes, onSave, onCancel }: {
  bytes: Uint8Array;
  onSave: (bytes: Uint8Array) => void;
  onCancel: () => void;
}) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pdf = await loadPdfDoc(bytes);
      const next: Cell[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const dataUrl = await renderPageToDataUrl(pdf, i, 0.4, 0.6);
        next.push({ id: crypto.randomUUID(), kind: 'page', srcIndex: i - 1, dataUrl, rotation: 0 });
      }
      await destroyPdfDoc(pdf);
      if (!cancelled) {
        setCells(next);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bytes]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function deleteSelected() {
    setCells((c) => c.filter((cell) => !selected.includes(cell.id)));
    setSelected([]);
  }

  function duplicate(id: string) {
    setCells((c) => {
      const idx = c.findIndex((x) => x.id === id);
      if (idx === -1) return c;
      const copy = { ...c[idx], id: crypto.randomUUID() };
      return [...c.slice(0, idx + 1), copy, ...c.slice(idx + 1)];
    });
  }

  function insertBlank(id: string) {
    setCells((c) => {
      const idx = c.findIndex((x) => x.id === id);
      const blank: Cell = { id: crypto.randomUUID(), kind: 'blank', rotation: 0 };
      if (idx === -1) return [...c, blank];
      return [...c.slice(0, idx + 1), blank, ...c.slice(idx + 1)];
    });
  }

  function move(id: string, dir: -1 | 1) {
    setCells((c) => {
      const idx = c.findIndex((x) => x.id === id);
      const swap = idx + dir;
      if (idx === -1 || swap < 0 || swap >= c.length) return c;
      const next = [...c];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function rotate(id: string) {
    setCells((c) => c.map((cell) => (cell.id === id ? { ...cell, rotation: (cell.rotation + 90) % 360 } : cell)));
  }

  async function save() {
    setSaving(true);
    try {
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const fallbackSize: [number, number] = src.getPageCount() ? [src.getPage(0).getWidth(), src.getPage(0).getHeight()] : [595.28, 841.89];
      for (const cell of cells) {
        if (cell.kind === 'blank') {
          out.addPage(fallbackSize);
          continue;
        }
        const [copied] = await out.copyPages(src, [cell.srcIndex!]);
        out.addPage(copied);
        if (cell.rotation) {
          const current = copied.getRotation().angle;
          copied.setRotation(degrees((current + cell.rotation) % 360));
        }
      }
      onSave(await out.save());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal">
      <div className="sheet">
        <h2>Organize pages</h2>
        {loading && <p className="viewer-status">Loading pages…</p>}
        <div className="page-manager-grid">
          {cells.map((cell, i) => (
            <div key={cell.id} className={`pm-cell ${selected.includes(cell.id) ? 'sel' : ''}`}>
              {cell.kind === 'blank' ? (
                <div className="pm-blank">Blank</div>
              ) : (
                <img src={cell.dataUrl} style={{ transform: `rotate(${cell.rotation}deg)` }} onClick={() => toggle(cell.id)} />
              )}
              <span className="pm-index">{i + 1}</span>
              <div className="pm-actions">
                <button onClick={() => move(cell.id, -1)} title="Move left"><MoveLeft size={14} /></button>
                {cell.kind === 'page' && <button onClick={() => rotate(cell.id)} title="Rotate"><RotateCw size={14} /></button>}
                {cell.kind === 'page' && <button onClick={() => duplicate(cell.id)} title="Duplicate"><Copy size={14} /></button>}
                <button onClick={() => insertBlank(cell.id)} title="Insert blank after"><FilePlus2 size={14} /></button>
                <button onClick={() => setCells((c) => c.filter((x) => x.id !== cell.id))} title="Delete"><Trash2 size={14} /></button>
                <button onClick={() => move(cell.id, 1)} title="Move right"><MoveRight size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="actions"><button onClick={deleteSelected}>Delete {selected.length} selected</button></div>
        )}
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={save} disabled={saving || !cells.length}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
