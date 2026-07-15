import { useEffect, useRef, useState } from 'react';
import { Check, Download, KeyRound, Lock, MoreVertical, Pencil, Share2, SquarePen, Star, Trash2 } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';
import { sharePdf, saveFileToDevice } from '../capacitor/share';
import { toast } from '../toast';
import { loadPdfDoc, renderPageToDataUrl, destroyPdfDoc } from '../pdf/render';

const thumbCache = new Map<string, string>();

export default function FileRow({ d, onOpen, onDelete, onToggleFavorite, onToggleSecure, onRename, onEdit, selectMode, selected, onSelectToggle }: {
  d: DocItem;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleSecure?: () => void;
  onRename?: (name: string) => void;
  onEdit?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(d.name.replace(/\.pdf$/i, ''));
  const rowRef = useRef<HTMLDivElement>(null);

  const [thumb, setThumb] = useState<string | null>(d.pages[0]?.dataUrl ?? thumbCache.get(d.id) ?? null);
  useEffect(() => {
    if (thumb || d.passwordProtected) return;
    let alive = true;
    (async () => {
      try {
        const bytes = new Uint8Array(await d.blob.arrayBuffer());
        const doc = await loadPdfDoc(bytes);
        const url = await renderPageToDataUrl(doc, 1, 0.5, 0.7);
        await destroyPdfDoc(doc);
        if (alive) { thumbCache.set(d.id, url); setThumb(url); }
      } catch { /* keep the glyph */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.id]);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: PointerEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [menuOpen]);

  async function download() {
    setMenuOpen(false);
    try { toast(await saveFileToDevice(d.blob, d.name)); }
    catch (e: any) { toast(e?.message || 'Could not save the file', { type: 'error' }); }
  }
  function commitRename() {
    const clean = name.trim();
    if (clean && onRename) onRename(clean.endsWith('.pdf') ? clean : `${clean}.pdf`);
    setRenaming(false);
  }

  const thumbEl = thumb
    ? <img className="file-thumb-img" src={thumb} alt="" />
    : <div className="file-thumb pdf"><span>PDF</span></div>;

  if (renaming) {
    return (
      <div className="file file-renaming" ref={rowRef}>
        {thumbEl}
        <input className="file-rename-input" value={name} autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }} />
        <button className="file-rename-ok" onClick={commitRename}><Check size={18} /></button>
      </div>
    );
  }

  return (
    <div className={`file${selected ? ' sel' : ''}`} ref={rowRef}>
      <button className="file-open" onClick={selectMode ? onSelectToggle : onOpen}>
        {selectMode && <span className={`pick-check${selected ? ' on' : ''}`}>{selected && <Check size={16} />}</span>}
        {thumbEl}
        <div className="file-meta">
          <b>{d.name}</b>
          <p>
            {formatBytes(d.size)} · {new Date(d.createdAt).toLocaleDateString()}
            {d.favorite && <Star size={12} className="badge" />}
            {d.secure && <Lock size={12} className="badge" />}
            {d.passwordProtected && <span title="Password protected"><KeyRound size={12} className="badge" /></span>}
          </p>
        </div>
      </button>
      {!selectMode && (
        <div className="file-menu">
          <button onClick={() => setMenuOpen((o) => !o)} title="More" aria-label="More actions"><MoreVertical size={18} /></button>
          {menuOpen && (
            <div className="file-menu-pop">
              <button onClick={() => { setMenuOpen(false); onOpen(); }}><SquarePen size={14} /> Open</button>
              {onEdit && <button onClick={() => { setMenuOpen(false); onEdit(); }}><Pencil size={14} /> Edit pages</button>}
              {onRename && <button onClick={() => { setMenuOpen(false); setName(d.name.replace(/\.pdf$/i, '')); setRenaming(true); }}><Pencil size={14} /> Rename</button>}
              <button onClick={download}><Download size={14} /> Download</button>
              <button onClick={() => { setMenuOpen(false); sharePdf(d.blob, d.name); }}><Share2 size={14} /> Share</button>
              {onToggleFavorite && (
                <button onClick={() => { onToggleFavorite(); setMenuOpen(false); }}>
                  <Star size={14} /> {d.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
              )}
              {onToggleSecure && (
                <button onClick={() => { onToggleSecure(); setMenuOpen(false); }}>
                  <Lock size={14} /> {d.secure ? 'Remove from Secure Folder' : 'Move to Secure Folder'}
                </button>
              )}
              {onDelete && (
                <button className="danger" onClick={() => { onDelete(); setMenuOpen(false); }}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
