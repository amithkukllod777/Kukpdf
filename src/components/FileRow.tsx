import { useEffect, useRef, useState } from 'react';
import { KeyRound, Lock, MoreVertical, Share2, Star, Trash2 } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';
import { sharePdf } from '../capacitor/share';
import { loadPdfDoc, renderPageToDataUrl, destroyPdfDoc } from '../pdf/render';

// Cache generated first-page thumbnails by doc id so switching tabs / re-rendering
// doesn't re-rasterize the same PDF (content is immutable per id here).
const thumbCache = new Map<string, string>();

export default function FileRow({ d, onOpen, onDelete, onToggleFavorite, onToggleSecure }: {
  d: DocItem;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleSecure?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Thumbnail: prefer a stored page image; otherwise lazily rasterize the PDF's
  // first page so every file shows a preview (not just scans/image-PDFs). Skip
  // password-protected PDFs — pdfjs can't render them without the password.
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
      } catch { /* leave the PDF glyph */ }
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

  const hasMenu = onToggleFavorite || onToggleSecure || onDelete;

  return (
    <div className="file" ref={rowRef}>
      <button className="file-open" onClick={onOpen}>
        {thumb ? (
          <img className="file-thumb-img" src={thumb} alt="" />
        ) : (
          <div className="file-thumb pdf"><span>PDF</span></div>
        )}
        <div>
          <b>{d.name}</b>
          <p>
            {formatBytes(d.size)} · {new Date(d.createdAt).toLocaleDateString()}
            {d.favorite && <Star size={12} className="badge" />}
            {d.secure && <Lock size={12} className="badge" />}
            {d.passwordProtected && <span title="Password protected"><KeyRound size={12} className="badge" /></span>}
          </p>
        </div>
      </button>
      <button onClick={() => sharePdf(d.blob, d.name)} title="Share"><Share2 size={16} /></button>
      {hasMenu && (
        <div className="file-menu">
          <button onClick={() => setMenuOpen((o) => !o)} title="More"><MoreVertical size={16} /></button>
          {menuOpen && (
            <div className="file-menu-pop">
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
                <button onClick={() => { onDelete(); setMenuOpen(false); }}>
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
