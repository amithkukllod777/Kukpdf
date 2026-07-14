import { useEffect, useRef, useState } from 'react';
import { Eraser, Redo2, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { loadPdfDoc, renderPageToDataUrl, destroyPdfDoc } from '../pdf/render';

const COLORS = ['#E11D1C', '#2563EB', '#16A34A', '#F59E0B', '#101828'];

/**
 * Freehand annotation editor. Renders each PDF page as a background image with a
 * full-resolution drawing canvas on top; strokes are baked into a new PDF on
 * save (pages become images — the same rasterize tradeoff as Unlock, which is
 * the only client-side way without a full PDF-editing engine).
 */
export default function AnnotateEditor({ blob, onSave, onCancel }: {
  blob: Blob;
  onSave: (bytes: Uint8Array) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [pages, setPages] = useState<string[]>([]);   // page background images (data URLs)
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [eraser, setEraser] = useState(false);
  const [dirty, setDirty] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef<(string | null)[]>([]);       // saved drawing layer per page (data URL)

  // Render all pages once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const doc = await loadPdfDoc(bytes);
      const imgs: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) imgs.push(await renderPageToDataUrl(doc, i, 1.6, 0.9));
      await destroyPdfDoc(doc);
      if (!alive) return;
      strokes.current = new Array(imgs.length).fill(null);
      setPages(imgs);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [blob]);

  // Size the drawing canvas to the current page image and restore its saved strokes.
  useEffect(() => {
    if (!pages[idx] || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const saved = strokes.current[idx];
      if (saved) { const s = new Image(); s.onload = () => ctx.drawImage(s, 0, 0); s.src = saved; }
    };
    img.src = pages[idx];
  }, [pages, idx]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (c.width / rect.width), y: (e.clientY - rect.top) * (c.height / rect.height) };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (eraser) { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 24; }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color; ctx.lineWidth = 4; }
    ctx.lineTo(p.x, p.y); ctx.stroke();
    setDirty(true);
  }
  function end() {
    drawing.current = false;
    strokes.current[idx] = canvasRef.current!.toDataURL('image/png'); // persist this page's layer
  }
  function clearPage() {
    const c = canvasRef.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    strokes.current[idx] = null; setDirty(true);
  }
  function go(next: number) {
    strokes.current[idx] = canvasRef.current!.toDataURL('image/png');
    setIdx(next);
  }

  async function save() {
    strokes.current[idx] = canvasRef.current!.toDataURL('image/png');
    setSaving(true);
    try {
      const out = await PDFDocument.create();
      for (let i = 0; i < pages.length; i++) {
        const bg = await loadImg(pages[i]);
        const c = document.createElement('canvas');
        c.width = bg.naturalWidth; c.height = bg.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(bg, 0, 0);
        if (strokes.current[i]) { const s = await loadImg(strokes.current[i]!); ctx.drawImage(s, 0, 0, c.width, c.height); }
        const jpg = c.toDataURL('image/jpeg', 0.9);
        const emb = await out.embedJpg(jpg);
        const page = out.addPage([emb.width, emb.height]);
        page.drawImage(emb, { x: 0, y: 0, width: emb.width, height: emb.height });
      }
      await onSave(await out.save());
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="modal"><div className="sheet"><h2>Annotate</h2><p className="viewer-status">Preparing pages…</p></div></div>;
  }

  return (
    <div className="modal">
      <div className="sheet annotate-sheet">
        <div className="annotate-top">
          <b>Annotate · page {idx + 1}/{pages.length}</b>
          <div className="annotate-tools">
            {COLORS.map((c) => (
              <button key={c} className={`swatch${color === c && !eraser ? ' on' : ''}`} style={{ background: c }} onClick={() => { setColor(c); setEraser(false); }} aria-label={`Colour ${c}`} />
            ))}
            <button className={`icon-btn${eraser ? ' on' : ''}`} onClick={() => setEraser((e) => !e)} aria-label="Eraser"><Eraser size={18} /></button>
            <button className="icon-btn" onClick={clearPage} aria-label="Clear page"><Trash2 size={18} /></button>
          </div>
        </div>

        <div className="annotate-stage">
          <img className="annotate-bg" src={pages[idx]} alt="" />
          <canvas
            ref={canvasRef}
            className="annotate-canvas"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>

        <div className="annotate-nav">
          <button disabled={idx === 0} onClick={() => go(idx - 1)}>Prev</button>
          <button disabled={idx >= pages.length - 1} onClick={() => go(idx + 1)}><Redo2 size={14} /> Next</button>
        </div>
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          <button disabled={saving || !dirty} onClick={save}>{saving ? 'Saving…' : 'Save annotated PDF'}</button>
        </div>
      </div>
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
