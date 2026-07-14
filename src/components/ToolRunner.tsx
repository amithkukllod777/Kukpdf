import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Share2, Upload } from 'lucide-react';
import type { DocItem, SignatureItem } from '../types';
import DocPicker from './DocPicker';
import PageManager from './PageManager';
import SignaturePad from './SignaturePad';
import {
  addPageNumbers,
  addWatermarkText,
  bytesToBlob,
  compressScannedPdf,
  fileOrBlobToBytes,
  mergePdfs,
  protectPdf,
  repairPdf,
  rotateAllPages,
  splitAllPages,
  stampImage,
  buildSearchablePdf,
} from '../pdf/tools';
import { imagesToPdf } from '../pdf/export';
import { ocrImage, type OcrLang } from '../ocr';
import { downloadBlob } from '../utils';
import { sharePdf } from '../capacitor/share';
import { destroyPdfDoc, loadPdfDoc, renderPageToDataUrl } from '../pdf/render';

const UNSUPPORTED: Record<string, string> = {
  Annotate: 'Freehand annotation editing needs a full PDF-editing engine — not built yet.',
  'Summarize PDF': 'AI summaries need a backend LLM service — this app is currently backend-free (client-only). Not built yet.',
  'Ask PDF': 'Document chat needs a backend LLM + vector search service. Not built yet.',
  'Unlock PDF': 'No reliable client-side library can decrypt an already-encrypted PDF (the encryption libraries checked only add passwords, they don\'t remove them). Not built yet — would need a server-side tool like qpdf.',
};

const NEEDS_MULTI = new Set(['Merge PDF']);
const NEEDS_PAGE_MANAGER = new Set(['Delete Pages', 'Reorder Pages']);
const IMAGE_SOURCE_TOOLS = new Set(['Image to PDF', 'JPG to PDF']);

export default function ToolRunner({ tool, docs, signatures, onDone, onCancel, onSaveSignature, onImportPdf }: {
  tool: string;
  docs: DocItem[];
  signatures: SignatureItem[];
  onDone: (doc: DocItem) => void;
  onCancel: () => void;
  onSaveSignature: (sig: SignatureItem) => void;
  onImportPdf: (file: File) => Promise<DocItem>;
}) {
  const [stage, setStage] = useState<'pick' | 'pick-images' | 'params' | 'running' | 'result' | 'unsupported'>(
    UNSUPPORTED[tool] ? 'unsupported' : IMAGE_SOURCE_TOOLS.has(tool) ? 'pick-images' : 'pick'
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<DocItem[]>([]);
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [watermarkText, setWatermarkText] = useState('KukPDF');
  const [compressLevel, setCompressLevel] = useState<'low' | 'recommended' | 'high'>('recommended');
  const [ocrLang, setOcrLang] = useState<OcrLang>('eng');
  const [pdfPassword, setPdfPassword] = useState('');
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [resultNote, setResultNote] = useState<string | null>(null);

  if (stage === 'unsupported') {
    return (
      <div className="modal">
        <div className="sheet">
          <h2>{tool}</h2>
          <p className="viewer-status">{UNSUPPORTED[tool]}</p>
          <div className="actions"><button onClick={onCancel}>Close</button></div>
        </div>
      </div>
    );
  }

  if (stage === 'pick') {
    return (
      <DocPicker
        title={`Choose a document for ${tool}`}
        docs={docs}
        multiple={NEEDS_MULTI.has(tool)}
        onCancel={onCancel}
        onImportPdf={onImportPdf}
        onPick={async (picked) => {
          setChosen(picked);
          if (NEEDS_PAGE_MANAGER.has(tool)) {
            setStage('params');
            return;
          }
          if (['Rotate PDF', 'Watermark', 'Compress PDF', 'Sign PDF', 'Image to Text', 'Searchable PDF', 'Password Protect'].includes(tool)) {
            setStage('params');
            return;
          }
          await run(picked);
        }}
      />
    );
  }

  if (stage === 'pick-images') {
    return (
      <div className="modal"><div className="sheet">
        <h2>{tool}</h2>
        <p className="viewer-status">Choose one or more images from your gallery or file manager — they'll become pages in a new PDF, in the order picked.</p>
        {error && <p className="viewer-status error">{error}</p>}
        <div className="actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => imageInputRef.current?.click()}><Upload size={16} /> Choose images</button>
        </div>
        <input
          ref={imageInputRef}
          hidden
          type="file"
          multiple
          accept={tool === 'JPG to PDF' ? 'image/jpeg' : 'image/*'}
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (!files.length) return;
            setStage('running');
            setProgressText(`Building PDF from ${files.length} image${files.length > 1 ? 's' : ''}…`);
            try {
              const blob = await imagesToPdf(files);
              setResult({ blob, name: `${tool === 'JPG to PDF' ? 'JPG to PDF' : 'Image to PDF'} ${new Date().toISOString().slice(0, 10)}.pdf` });
              setStage('result');
            } catch (err: any) {
              setError(err?.message || 'Could not build a PDF from those images');
              setStage('pick-images');
            }
          }}
        />
      </div></div>
    );
  }

  async function saveOutput(bytes: Uint8Array, name: string) {
    const blob = bytesToBlob(bytes);
    setResult({ blob, name });
    setStage('result');
  }

  async function run(picked: DocItem[]) {
    setStage('running');
    setError(null);
    try {
      const base = picked[0];
      const bytes = await fileOrBlobToBytes(base?.blob ?? new Blob());
      if (tool === 'Merge PDF') {
        const all = await Promise.all(picked.map((d) => fileOrBlobToBytes(d.blob)));
        return saveOutput(await mergePdfs(all), 'Merged.pdf');
      }
      if (tool === 'Split PDF') {
        setProgressText('Splitting pages…');
        const parts = await splitAllPages(bytes);
        parts.forEach((part, i) => onDone(makeDoc(`${stripExt(base.name)} - page ${i + 1}.pdf`, bytesToBlob(part))));
        setAlreadySaved(true);
        setResultNote(`Split into ${parts.length} single-page PDFs and saved to Files.`);
        setResult({ blob: bytesToBlob(parts[0]), name: `${stripExt(base.name)} - page 1.pdf` });
        setStage('result');
        return;
      }
      if (tool === 'Repair PDF') {
        return saveOutput(await repairPdf(bytes), `${stripExt(base.name)} (repaired).pdf`);
      }
      if (tool === 'Page Numbers') {
        return saveOutput(await addPageNumbers(bytes), `${stripExt(base.name)} (numbered).pdf`);
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setStage('params');
    }
  }

  function makeDoc(name: string, blob: Blob): DocItem {
    return { id: crypto.randomUUID(), name, kind: 'pdf', pages: [], createdAt: Date.now(), size: blob.size, blob, passwordProtected: tool === 'Password Protect' };
  }

  function stripExt(name: string) {
    return name.replace(/\.pdf$/i, '');
  }

  if (stage === 'params') {
    if (NEEDS_PAGE_MANAGER.has(tool)) {
      return (
        <PageManagerWrap
          doc={chosen[0]}
          onCancel={onCancel}
          onSave={async (bytes) => {
            setStage('running');
            await saveOutput(bytes, `${stripExt(chosen[0].name)} (edited).pdf`);
          }}
        />
      );
    }
    if (tool === 'Rotate PDF') {
      return (
        <div className="modal"><div className="sheet">
          <h2>Rotate all pages</h2>
          <div className="actions">
            {[90, 180, 270].map((deg) => (
              <button key={deg} onClick={async () => {
                setStage('running');
                const bytes = await fileOrBlobToBytes(chosen[0].blob);
                await saveOutput(await rotateAllPages(bytes, deg), `${stripExt(chosen[0].name)} (rotated).pdf`);
              }}>{deg}°</button>
            ))}
          </div>
          <div className="actions"><button onClick={onCancel}>Cancel</button></div>
        </div></div>
      );
    }
    if (tool === 'Watermark') {
      return (
        <div className="modal"><div className="sheet">
          <h2>Add watermark</h2>
          <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Watermark text" />
          {error && <p className="viewer-status error">{error}</p>}
          <div className="actions">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={async () => {
              setStage('running');
              const bytes = await fileOrBlobToBytes(chosen[0].blob);
              await saveOutput(await addWatermarkText(bytes, watermarkText || 'KukPDF'), `${stripExt(chosen[0].name)} (watermarked).pdf`);
            }}>Apply</button>
          </div>
        </div></div>
      );
    }
    if (tool === 'Password Protect') {
      return (
        <div className="modal"><div className="sheet">
          <h2>Password protect</h2>
          <p className="viewer-status">Encrypts the PDF with AES-128 — anyone opening it will need this password.</p>
          <input
            type="password"
            value={pdfPassword}
            onChange={(e) => setPdfPassword(e.target.value)}
            placeholder="Set a password"
            autoFocus
          />
          {error && <p className="viewer-status error">{error}</p>}
          <div className="actions">
            <button onClick={onCancel}>Cancel</button>
            <button
              disabled={pdfPassword.length < 4}
              onClick={async () => {
                setStage('running');
                setProgressText('Encrypting…');
                try {
                  const bytes = await fileOrBlobToBytes(chosen[0].blob);
                  const out = await protectPdf(bytes, pdfPassword);
                  setResultNote('Encrypted with your password. Any PDF reader will now ask for it before opening — remember it, there is no recovery. Other KukPDF tools and the in-app viewer can\'t open protected PDFs, so this file is excluded from their pickers.');
                  await saveOutput(out, `${stripExt(chosen[0].name)} (protected).pdf`);
                } catch (e: any) {
                  setError(e?.message || 'Could not encrypt this PDF');
                  setStage('params');
                }
              }}
            >Protect</button>
          </div>
        </div></div>
      );
    }
    if (tool === 'Compress PDF') {
      return (
        <div className="modal"><div className="sheet">
          <h2>Compress PDF</h2>
          <p className="viewer-status">Rasterizes pages to smaller JPEGs — best for scanned documents. Original: {(chosen[0].size / 1024).toFixed(0)} KB</p>
          <div className="chips">
            {(['low', 'recommended', 'high'] as const).map((l) => (
              <button key={l} className={compressLevel === l ? 'chip active' : 'chip'} onClick={() => setCompressLevel(l)}>{l}</button>
            ))}
          </div>
          <div className="actions">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={async () => {
              setStage('running');
              setProgressText('Compressing…');
              const bytes = await fileOrBlobToBytes(chosen[0].blob);
              await saveOutput(await compressScannedPdf(bytes, compressLevel), `${stripExt(chosen[0].name)} (compressed).pdf`);
            }}>Compress</button>
          </div>
        </div></div>
      );
    }
    if (tool === 'Sign PDF') {
      return (
        <div className="modal"><div className="sheet">
          <h2>Sign PDF</h2>
          {signatures.length === 0 && <p className="viewer-status">No saved signatures yet.</p>}
          <div className="grid">
            {signatures.map((s) => (
              <button key={s.id} className="tool" onClick={async () => {
                setStage('running');
                const bytes = await fileOrBlobToBytes(chosen[0].blob);
                const pageIndex = Math.max(0, (chosen[0].pages.length || 1) - 1);
                await saveOutput(await stampImage(bytes, pageIndex, s.dataUrl, 0.55, 0.85, 0.35, 0.1), `${stripExt(chosen[0].name)} (signed).pdf`);
              }}>
                <img src={s.dataUrl} style={{ width: '100%', height: 48, objectFit: 'contain' }} />
                <span>Use this</span>
              </button>
            ))}
          </div>
          <div className="actions">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={() => setShowSignaturePad(true)}>Draw new signature</button>
          </div>
          {showSignaturePad && (
            <SignaturePad
              onCancel={() => setShowSignaturePad(false)}
              onSave={(dataUrl) => {
                const sig: SignatureItem = { id: crypto.randomUUID(), dataUrl, createdAt: Date.now() };
                onSaveSignature(sig);
                setShowSignaturePad(false);
              }}
            />
          )}
        </div></div>
      );
    }
    if (tool === 'Image to Text' || tool === 'Searchable PDF') {
      return (
        <div className="modal"><div className="sheet">
          <h2>{tool}</h2>
          <div className="chips">
            {(['eng', 'hin', 'eng+hin'] as OcrLang[]).map((l) => (
              <button key={l} className={ocrLang === l ? 'chip active' : 'chip'} onClick={() => setOcrLang(l)}>{l === 'eng' ? 'English' : l === 'hin' ? 'Hindi' : 'English + Hindi'}</button>
            ))}
          </div>
          <p className="viewer-status">OCR runs fully on-device — English and Hindi work offline, no internet needed.</p>
          {ocrText !== null && (
            <div className="ocr-result"><pre>{ocrText}</pre></div>
          )}
          <div className="actions">
            <button onClick={onCancel}>Cancel</button>
            {ocrText === null ? (
              <button onClick={async () => {
                setStage('running');
                setProgressText('Running OCR…');
                setProgressPct(0);
                if (tool === 'Searchable PDF') {
                  const bytes = await fileOrBlobToBytes(chosen[0].blob);
                  const out = await buildSearchablePdf(bytes, ocrLang, (p, t, pct) => { setProgressText(`OCR page ${p}/${t}`); setProgressPct(pct); });
                  await saveOutput(out, `${stripExt(chosen[0].name)} (searchable).pdf`);
                } else {
                  const bytes = await fileOrBlobToBytes(chosen[0].blob);
                  const doc = await loadPdfDoc(bytes);
                  let all = '';
                  for (let i = 1; i <= doc.numPages; i++) {
                    setProgressText(`OCR page ${i}/${doc.numPages}`);
                    const dataUrl = await renderPageToDataUrl(doc, i, 1.6);
                    all += (await ocrImage(dataUrl, ocrLang, (pct) => setProgressPct(pct))) + '\n\n';
                  }
                  await destroyPdfDoc(doc);
                  setProgressPct(null);
                  setOcrText(all.trim());
                  setStage('params');
                }
              }}>Run OCR</button>
            ) : (
              <button onClick={() => navigator.clipboard?.writeText(ocrText)}>Copy text</button>
            )}
          </div>
        </div></div>
      );
    }
  }

  if (stage === 'running') {
    return (
      <div className="modal"><div className="sheet">
        <h2>{tool}</h2>
        <p className="viewer-status">{progressText || 'Working…'}{progressPct !== null ? ` · ${progressPct}%` : ''}</p>
        {progressPct !== null && (
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
        )}
        <div className="actions"><button onClick={onCancel}>Cancel</button></div>
      </div></div>
    );
  }

  if (stage === 'result' && result) {
    return (
      <div className="modal"><div className="sheet">
        <div className="result-head"><CheckCircle2 color="#16a34a" /><h2>Done</h2></div>
        <p className="viewer-status">{resultNote ?? `${result.name} · ${(result.blob.size / 1024).toFixed(0)} KB`}</p>
        <div className="actions">
          <button onClick={() => downloadBlob(result.blob, result.name)}><Download size={16} />Download</button>
          <button onClick={() => sharePdf(result.blob, result.name)}><Share2 size={16} />Share</button>
        </div>
        <div className="actions">
          {alreadySaved ? (
            <button onClick={onCancel}>Close</button>
          ) : (
            <button onClick={() => { onDone(makeDoc(result.name, result.blob)); onCancel(); }}>Save to Files &amp; close</button>
          )}
        </div>
      </div></div>
    );
  }

  return null;
}

function PageManagerWrap({ doc, onCancel, onSave }: { doc: DocItem; onCancel: () => void; onSave: (bytes: Uint8Array) => void }) {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  useEffect(() => {
    let cancelled = false;
    fileOrBlobToBytes(doc.blob).then((b) => { if (!cancelled) setBytes(b); });
    return () => { cancelled = true; };
  }, [doc]);
  if (!bytes) return <div className="modal"><div className="sheet"><p className="viewer-status">Loading…</p></div></div>;
  return <PageManager bytes={bytes} onCancel={onCancel} onSave={onSave} />;
}
