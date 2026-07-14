import { useEffect, useState } from 'react';
import { FileText, Sheet, Download, Share2, Crown } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import type { DocItem } from '../types';
import { fileOrBlobToBytes } from '../pdf/tools';
import { downloadBlob } from '../utils';
import { sharePdf } from '../capacitor/share';
import { AUTH_BASE } from '../kuklabs/authClient';
import { pdfToOffice, getOfficeQuota, OfficeError, type OfficeFormat, type OfficeQuota } from '../kuklabs/officeClient';

/**
 * PDF → Word / Excel export. This runs LibreOffice on the shared backend, so it's
 * a server-API (Pro-gated + daily-limited) tool — not a free on-device one. Picks
 * a PDF, converts it server-side, and lets the user download/share the result.
 */
export default function OfficeExportPanel({ mode, doc, onClose }: {
  mode: OfficeFormat;
  doc: DocItem;
  onClose: () => void;
}) {
  const [quota, setQuota] = useState<OfficeQuota | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const label = mode === 'docx' ? 'PDF to Word' : 'PDF to Excel';
  const ext = mode === 'docx' ? 'docx' : 'xlsx';
  const Icon = mode === 'docx' ? FileText : Sheet;
  const base = doc.name.replace(/\.pdf$/i, '');

  useEffect(() => {
    let alive = true;
    getOfficeQuota().then((q) => { if (alive) setQuota(q); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  function handleErr(e: unknown) {
    if (e instanceof OfficeError) { setError(e.message); setShowUpgrade(e.upgrade || e.status === 402); }
    else setError((e as any)?.message || 'Export failed. Please try again.');
  }
  async function openPricing() { await Browser.open({ url: `${AUTH_BASE}/pdf/pricing` }); }

  async function convert() {
    setBusy(true); setError(null); setShowUpgrade(false);
    try {
      const bytes = await fileOrBlobToBytes(doc.blob);
      const blob = await pdfToOffice(bytes, mode, base);
      setResult({ blob, name: `${base}.${ext}` });
      getOfficeQuota().then(setQuota).catch(() => {});
    } catch (e) { handleErr(e); } finally { setBusy(false); }
  }

  if (result) {
    return (
      <div className="modal"><div className="sheet">
        <div className="result-head"><Icon color="#16a34a" /><h2>Done</h2></div>
        <p className="viewer-status">{result.name} · {(result.blob.size / 1024).toFixed(0)} KB · best-effort conversion — check the layout.</p>
        <div className="actions">
          <button onClick={() => downloadBlob(result.blob, result.name)}><Download size={16} />Download</button>
          <button onClick={() => sharePdf(result.blob, result.name)}><Share2 size={16} />Share</button>
        </div>
        <div className="actions"><button onClick={onClose}>Close</button></div>
      </div></div>
    );
  }

  return (
    <div className="modal">
      <div className="sheet ai-sheet">
        <div className="ai-head">
          <Icon size={18} className="ai-spark" />
          <b>{label}</b>
          {quota && quota.signedIn && quota.limit > 0 && (
            <span className="ai-quota">{quota.remaining} / {quota.limit} left today</span>
          )}
        </div>
        <p className="ai-doc" title={doc.name}>{doc.name}</p>
        <p className="viewer-status">Converts your PDF to an editable {mode === 'docx' ? 'Word (.docx)' : 'Excel (.xlsx)'} file on the server. A Pro feature — results are best-effort and depend on the source PDF.</p>

        {error && (
          <div className="ai-error">
            <p className="viewer-status error">{error}</p>
            {showUpgrade && <button className="ai-upgrade" onClick={openPricing}><Crown size={15} /> Upgrade to KukPDF Pro</button>}
          </div>
        )}

        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button disabled={busy} onClick={convert}>{busy ? 'Converting…' : `Convert to ${mode === 'docx' ? 'Word' : 'Excel'}`}</button>
        </div>
      </div>
    </div>
  );
}
