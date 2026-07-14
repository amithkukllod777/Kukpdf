import { useEffect, useState } from 'react';
import { BadgeCheck, ChevronRight, CloudUpload, LogIn, Shield, Sparkles, Trash2 } from 'lucide-react';
import type { DocItem, SignatureItem, Tab } from '../types';
import Header from '../components/Header';
import { hasPin, setPin, clearPin, verifyPin } from '../capacitor/lock';
import { productBrand, versionLabel } from '../brand';
import type { KuklabsUser } from '../kuklabs/authClient';
import { makeZip } from '../export/zip';
import { sharePdf } from '../capacitor/share';
import { sanitizeFilename } from '../utils';
import { toast } from '../toast';

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initials(user: KuklabsUser): string {
  const src = (user.name || user.email || '?').trim();
  const parts = src.split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

/** Profile — KUKLABS_IDENTITY.md §16: Kuklabs Account · Security · About. */
export default function ProfilePage({ docs, signatures, user, onSignIn, onSignOut, onDeleteSignature, onUnlockSecure, setTab, onOpenLegal, onSync, syncing, syncMsg }: {
  docs: DocItem[];
  signatures: SignatureItem[];
  user: KuklabsUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDeleteSignature: (id: string) => void;
  onUnlockSecure: () => void;
  setTab: (t: Tab) => void;
  onOpenLegal: (doc: 'privacy' | 'terms') => void;
  onSync: () => void;
  syncing: boolean;
  syncMsg: string | null;
}) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'set' | 'unlock'>('idle');
  const [msg, setMsg] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { hasPin().then(setPinEnabled); }, []);

  /** Export all documents as a single .zip the user can save/share (data portability). */
  async function exportData() {
    const items = docs.filter((d) => !d.trashed);
    if (!items.length) { toast('No documents to export', { type: 'info' }); return; }
    setExporting(true);
    try {
      const used = new Set<string>();
      const entries = await Promise.all(items.map(async (d) => {
        let name = sanitizeFilename(d.name.endsWith('.pdf') ? d.name : `${d.name}.pdf`);
        while (used.has(name)) name = name.replace(/(\.pdf)$/i, `-${Math.random().toString(36).slice(2, 6)}$1`);
        used.add(name);
        return { name, data: new Uint8Array(await d.blob.arrayBuffer()) };
      }));
      const zip = makeZip(entries);
      await sharePdf(zip, `KukPDF-documents-${todayStamp()}.zip`);
      toast(`Exported ${entries.length} document${entries.length > 1 ? 's' : ''}`);
    } catch (e: any) {
      toast('Export failed. Try again.', { type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <section>
      <Header title="Profile" sub={`${productBrand.productName} · ${productBrand.website}`} />

      {/* Identity card §16.3 */}
      {user ? (
        <div className="identity-card">
          <div className="avatar">{initials(user).toUpperCase() || <LogIn size={26} />}</div>
          <div className="tx">
            <b>{user.name || 'Kuklabs Account'}</b>
            <span>{user.email}</span>
            <span className="verify"><BadgeCheck size={13} /> Kuklabs Account</span>
          </div>
        </div>
      ) : (
        <button className="identity-card" style={{ width: '100%', textAlign: 'left' }} onClick={onSignIn}>
          <div className="avatar"><LogIn size={26} /></div>
          <div className="tx">
            <b>Sign in to Kuklabs</b>
            <span>One account across every Kuk app</span>
          </div>
          <ChevronRight className="go" size={20} />
        </button>
      )}

      <div className="card pro">
        <Sparkles /><b> KukPDF Pro</b>
        <p>Unlimited scans, batch OCR and priority support — coming soon with your Kuklabs account.</p>
      </div>

      {user && (
        <>
          <h2>Cloud sync</h2>
          <div className="card sync-card">
            <div className="sync-head">
              <span className="sync-ico"><CloudUpload size={18} /></span>
              <div className="tx">
                <b>Back up &amp; sync</b>
                <span>Your PDFs sync to your Kuklabs account across devices.</span>
              </div>
            </div>
            <button className="wide" disabled={syncing} onClick={onSync}>{syncing ? 'Syncing…' : 'Sync now'}</button>
            {syncMsg && <p className="viewer-status">{syncMsg}</p>}
          </div>
        </>
      )}

      <h2>Security</h2>
      <div className="card">
        {!pinEnabled && mode === 'idle' && (
          <>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> App lock is off.</p>
            <button onClick={() => setMode('set')}>Set app PIN</button>
          </>
        )}
        {mode === 'set' && (
          <>
            <input inputMode="numeric" maxLength={6} placeholder="Choose a 4–6 digit PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
            <div className="actions">
              <button onClick={() => { setMode('idle'); setPinInput(''); }}>Cancel</button>
              <button onClick={async () => { if (pinInput.length >= 4) { await setPin(pinInput); setPinEnabled(true); setPinInput(''); setMode('idle'); setMsg('App PIN set.'); } }}>Save PIN</button>
            </div>
          </>
        )}
        {pinEnabled && mode === 'idle' && (
          <>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> App lock is on.</p>
            <div className="actions">
              <button onClick={() => setMode('unlock')}>Unlock Secure Folder</button>
              <button onClick={async () => { await clearPin(); setPinEnabled(false); setMsg('App PIN removed.'); }}>Remove PIN</button>
            </div>
          </>
        )}
        {mode === 'unlock' && (
          <>
            <input inputMode="numeric" maxLength={6} placeholder="Enter PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
            <div className="actions">
              <button onClick={() => { setMode('idle'); setPinInput(''); }}>Cancel</button>
              <button onClick={async () => {
                if (await verifyPin(pinInput)) { onUnlockSecure(); setMode('idle'); setPinInput(''); setTab('files'); }
                else setMsg('Wrong PIN.');
              }}>Unlock</button>
            </div>
          </>
        )}
        {msg && <p className="viewer-status">{msg}</p>}
      </div>

      <h2>Saved signatures</h2>
      <div className="list">
        {signatures.length === 0 && <p className="viewer-status">None yet — created from the Sign PDF tool.</p>}
        {signatures.map((s) => (
          <div key={s.id} className="file">
            <img src={s.dataUrl} style={{ width: 60, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 6 }} />
            <div />
            <button onClick={() => onDeleteSignature(s.id)} aria-label="Delete signature"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <h2>About this app</h2>
      <div className="setting"><span>Documents on this device</span><span style={{ fontWeight: 700 }}>{docs.length}</span></div>
      <div className="setting"><span>Privacy Policy</span><button onClick={() => onOpenLegal('privacy')}>View</button></div>
      <div className="setting"><span>Terms of Use</span><button onClick={() => onOpenLegal('terms')}>View</button></div>
      <div className="setting"><span>Export my documents</span><button disabled={exporting} onClick={exportData}>{exporting ? 'Exporting…' : 'Export .zip'}</button></div>

      {user && (
        <button className="wide" style={{ background: 'transparent', color: 'var(--error)', fontWeight: 600, minHeight: 48, marginTop: 8 }} onClick={onSignOut}>
          Sign out
        </button>
      )}

      {/* Version — Kuklabs App Version Display Policy: bottom-most muted,
          centre-aligned footer only; never on auth screens; no channel/commit. */}
      <p className="powered">Powered by <b>Kuklabs</b></p>
      <p className="about-version">{versionLabel}</p>
    </section>
  );
}
