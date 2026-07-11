import { useEffect, useRef, useState } from 'react';
import { loadPdfDoc, renderPageToCanvas } from '../pdf/render';

export default function PdfViewer({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pdfRef: any = null;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const pdf = await loadPdfDoc(bytes);
        pdfRef = pdf;
        if (cancelled) return;
        setPageCount(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const canvas = await renderPageToCanvas(pdf, i, 1.4);
          canvas.className = 'viewer-page';
          if (!cancelled) container.appendChild(canvas);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not render this PDF');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      pdfRef?.destroy?.();
    };
  }, [blob]);

  return (
    <div className="pdf-viewer">
      {loading && <p className="viewer-status">Rendering {pageCount ? `${pageCount} pages` : 'PDF'}…</p>}
      {error && <p className="viewer-status error">{error}</p>}
      <div className="viewer-pages" ref={containerRef} />
    </div>
  );
}
