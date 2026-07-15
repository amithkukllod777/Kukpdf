import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Copy, Crown, X, LogIn } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import type { DocItem } from '../types';
import { extractPdfText } from '../pdf/render';
import { fileOrBlobToBytes } from '../pdf/tools';
import { AUTH_BASE, getToken } from '../kuklabs/authClient';
import { getAiQuota, summarizePdf, askPdf, AiError, type AiQuota } from '../kuklabs/aiClient';

/**
 * Summarize PDF / Ask PDF — the two AI tools. These are the only tools that use
 * our metered LLM, so they require a signed-in Kuklabs account and are subject
 * to the plan's daily quota (free = small trial, Pro = higher cap). Text is
 * extracted on-device and sent to /api/kukpdf/ai; a scan with no text layer is
 * refused with a "run OCR first" note rather than sending an empty document.
 */
export default function AiToolPanel({ mode, doc, onClose }: {
  mode: 'summarize' | 'ask';
  doc: DocItem;
  onClose: () => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [prep, setPrep] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null); // null = still checking
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [summary, setSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<{ q: string; a: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Extract the PDF text + read the current quota once.
  useEffect(() => {
    let alive = true;
    (async () => {
      // AI needs a signed-in Kuklabs account — check first so we can show a clear
      // sign-in prompt instead of doing work and then failing with a 401.
      try { const token = await getToken(); if (alive) setSignedIn(!!token); } catch { if (alive) setSignedIn(false); }
      try {
        const bytes = await fileOrBlobToBytes(doc.blob);
        const extracted = await extractPdfText(bytes);
        if (alive) setText(extracted);
      } catch {
        if (alive) setText('');
      } finally {
        if (alive) setPrep(false);
      }
      try { const q = await getAiQuota(); if (alive) setQuota(q); } catch { /* quota is best-effort */ }
    })();
    return () => { alive = false; };
  }, [doc]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [turns]);

  function handleErr(e: unknown) {
    if (e instanceof AiError) {
      setError(e.message);
      setShowUpgrade(e.upgrade || e.status === 402);
    } else {
      setError((e as any)?.message || 'AI request failed. Please try again.');
    }
  }

  async function refreshQuota() {
    try { setQuota(await getAiQuota()); } catch { /* ignore */ }
  }

  async function openPricing() {
    await Browser.open({ url: `${AUTH_BASE}/pdf/pricing` });
  }

  async function doSummarize() {
    if (!text) return;
    setBusy(true); setError(null); setShowUpgrade(false);
    try {
      setSummary(await summarizePdf(text));
      await refreshQuota();
    } catch (e) { handleErr(e); } finally { setBusy(false); }
  }

  async function doAsk() {
    const q = question.trim();
    if (!q || !text) return;
    setBusy(true); setError(null); setShowUpgrade(false);
    try {
      const a = await askPdf(text, q);
      setTurns((t) => [...t, { q, a }]);
      setQuestion('');
      await refreshQuota();
    } catch (e) { handleErr(e); } finally { setBusy(false); }
  }

  const title = mode === 'summarize' ? 'Summarize PDF' : 'Ask PDF';
  const noText = text !== null && text.length === 0;

  return (
    <div className="modal">
      <div className="sheet ai-sheet">
        <div className="ai-head">
          <Sparkles size={18} className="ai-spark" />
          <b>{title}</b>
          {quota && quota.signedIn && quota.limit < 1_000_000 && (
            <span className="ai-quota">{quota.remaining} / {quota.limit} left today</span>
          )}
          {/* Always-present close so the user is never trapped (e.g. a text-less scan). */}
          <button className="ai-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="ai-doc" title={doc.name}>{doc.name}</p>

        {/* Not signed in → AI needs an account. Show a clear prompt, not a silent 401. */}
        {signedIn === false ? (
          <>
            <div className="ai-signin"><LogIn size={22} /></div>
            <p className="viewer-status">AI tools need your <b>Kuklabs account</b>. Sign in from <b>Profile → Sign in</b>, then come back and try again. (Free accounts get a daily AI trial.)</p>
            <div className="actions"><button onClick={onClose}>Close</button></div>
          </>
        ) : (
        <>
        {(prep || signedIn === null) && <p className="viewer-status">Reading the document…</p>}

        {!prep && noText && (
          <p className="viewer-status">This PDF has no selectable text (it looks like a scan). Run <b>Image to Text</b> or <b>Searchable PDF</b> first, then try AI on the result.</p>
        )}

        {error && (
          <div className="ai-error">
            <p className="viewer-status error">{error}</p>
            {showUpgrade && (
              <button className="ai-upgrade" onClick={openPricing}><Crown size={15} /> Upgrade to KukPDF Pro</button>
            )}
          </div>
        )}

        {/* Summarize */}
        {!prep && !noText && mode === 'summarize' && (
          <>
            {summary && (
              <div className="ai-answer">
                <pre>{summary}</pre>
                <button className="ai-copy" onClick={() => navigator.clipboard?.writeText(summary)}><Copy size={14} /> Copy</button>
              </div>
            )}
            <div className="actions">
              <button onClick={onClose}>Close</button>
              <button disabled={busy} onClick={doSummarize}>
                {busy ? 'Summarizing…' : summary ? 'Summarize again' : 'Summarize'}
              </button>
            </div>
          </>
        )}

        {/* Ask */}
        {!prep && !noText && mode === 'ask' && (
          <>
            <div className="ai-chat" ref={scrollRef}>
              {turns.length === 0 && <p className="viewer-status">Ask anything about this PDF — dates, amounts, names, a summary of a section…</p>}
              {turns.map((t, i) => (
                <div key={i} className="ai-turn">
                  <div className="ai-q">{t.q}</div>
                  <div className="ai-a"><pre>{t.a}</pre></div>
                </div>
              ))}
              {busy && <p className="viewer-status">Thinking…</p>}
            </div>
            <div className="ai-ask-row">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !busy) doAsk(); }}
                placeholder="Ask a question…"
                disabled={busy}
                autoFocus
              />
              <button className="ai-send" disabled={busy || !question.trim()} onClick={doAsk} aria-label="Send"><Send size={18} /></button>
            </div>
            <div className="actions"><button onClick={onClose}>Close</button></div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
