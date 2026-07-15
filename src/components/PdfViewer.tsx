import { useEffect, useRef, useState } from 'react';
import { Lock, Minus, Plus } from 'lucide-react';
import { loadPdfDoc, loadPdfDocWithPassword, renderPageToCanvas } from '../pdf/render';

/**
 * In-app PDF viewer. Renders every page to a canvas (continuous scroll) with
 * pinch-friendly zoom controls. Password-protected PDFs are opened IN-APP by
 * prompting for the password (pdfjs can decrypt with it) instead of sending the
 * user off to another reader.
 */
export default function PdfViewer({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [zoom, setZoom] = useState(1.4);
  const pw = useRef('');           // last accepted password (for re-render on zoom)

  useEffect(() => {
    let cancelled = false;
    let pdfRef: any = null;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const pdf = pw.current
          ? await loadPdfDocWithPassword(bytes, pw.current)
          : await loadPdfDoc(bytes);
        pdfRef = pdf;
        if (cancelled) return;
        setNeedPassword(false);
        setPageCount(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const canvas = await renderPageToCanvas(pdf, i, zoom);
          canvas.className = 'viewer-page';
          if (!cancelled) container.appendChild(canvas);
        }
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === 'PasswordException') {
          setNeedPassword(true);
          setError(pw.current ? 'Wrong password — check it and try again.' : null);
          pw.current = ''; // don't keep a rejected password
        } else {
          setError(e?.message || 'Could not render this PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
        pdfRef?.destroy?.();
      }
    })();
    return () => { cancelled = true; };
    // re-render when the file changes, when a password is submitted, or on zoom
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob, zoom, needPassword ? '' : pw.current]);

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    pw.current = password;
    setPassword('');
    setNeedPassword(false); // triggers the effect to re-render with pw.current
  }

  if (needPassword) {
    return (
      <div className="pdf-viewer">
        <form className="pdf-pw" onSubmit={submitPassword}>
          <div className="pdf-pw-ico"><Lock size={22} /></div>
          <b>This PDF is password-protected</b>
          <p className="viewer-status">Enter the password to open it here in KukPDF.</p>
          {error && <p className="viewer-status error">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PDF password"
            autoFocus
          />
          <button className="primary wide" type="submit" disabled={!password}>Open PDF</button>
        </form>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {loading && <p className="viewer-status">Rendering {pageCount ? `${pageCount} pages` : 'PDF'}…</p>}
      {error && <p className="viewer-status error">{error}</p>}
      <div className="viewer-pages" ref={containerRef} />
      {pageCount > 0 && !loading && (
        <div className="viewer-zoom">
          <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.3).toFixed(2)))} aria-label="Zoom out"><Minus size={18} /></button>
          <span>{Math.round(zoom / 1.4 * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.3).toFixed(2)))} aria-label="Zoom in"><Plus size={18} /></button>
        </div>
      )}
    </div>
  );
}
