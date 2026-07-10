import { useEffect, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import type { DocItem, SignatureItem, Tab } from '../types';
import Header from '../components/Header';
import { hasPin, setPin, clearPin, verifyPin } from '../capacitor/lock';

export default function ProfilePage({ docs, signatures, onDeleteSignature, onUnlockSecure, setTab, onOpenLegal }: {
  docs: DocItem[];
  signatures: SignatureItem[];
  onDeleteSignature: (id: string) => void;
  onUnlockSecure: () => void;
  setTab: (t: Tab) => void;
  onOpenLegal: (doc: 'privacy' | 'terms') => void;
}) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'set' | 'unlock'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hasPin().then(setPinEnabled);
  }, []);

  return (
    <section>
      <Header title="Profile" sub="Kuklabs Inc. · kuklabs.com" />
      <div className="card brand-card">
        <img src="/kuklabs-mark.svg" alt="Kuklabs" />
        <div><b>KukPDF</b><p>Smart PDF Scanner & Tools</p><small>A Kuklabs Product</small></div>
      </div>
      <div className="card pro">
        <Sparkles /><b>KukPDF Pro</b>
        <p>Unlimited scans, batch OCR, cloud sync, no watermark — coming soon (needs a backend, not built yet).</p>
      </div>
      <div className="card"><b>Usage</b><p>{docs.length} documents saved on this device</p></div>

      <h2>Saved signatures</h2>
      <div className="list">
        {signatures.length === 0 && <p className="viewer-status">None yet — created from the Sign PDF tool.</p>}
        {signatures.map((s) => (
          <div key={s.id} className="file">
            <img src={s.dataUrl} style={{ width: 60, height: 32, objectFit: 'contain', background: '#fff' }} />
            <div style={{ flex: 1 }} />
            <button onClick={() => onDeleteSignature(s.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <h2>Secure Folder</h2>
      <div className="card">
        {!pinEnabled && mode === 'idle' && (
          <>
            <p>No PIN set. Set one to lock the app and protect your Secure Folder.</p>
            <button onClick={() => setMode('set')}>Set PIN</button>
          </>
        )}
        {mode === 'set' && (
          <>
            <input inputMode="numeric" maxLength={6} placeholder="Choose a 4-6 digit PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
            <div className="actions">
              <button onClick={() => setMode('idle')}>Cancel</button>
              <button onClick={async () => { if (pinInput.length >= 4) { await setPin(pinInput); setPinEnabled(true); setPinInput(''); setMode('idle'); setMsg('PIN set.'); } }}>Save PIN</button>
            </div>
          </>
        )}
        {pinEnabled && mode === 'idle' && (
          <>
            <p>PIN lock is on.</p>
            <div className="actions">
              <button onClick={() => setMode('unlock')}>Unlock Secure Folder</button>
              <button onClick={async () => { await clearPin(); setPinEnabled(false); setMsg('PIN removed.'); }}>Remove PIN</button>
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

      {['Company: Kuklabs Inc.', 'Website: kuklabs.com', 'Developer: Kuklabs Inc.'].map((x) => (
        <div className="setting" key={x}><span>{x}</span></div>
      ))}
      <div className="setting"><span>Privacy Policy</span><button onClick={() => onOpenLegal('privacy')}>View</button></div>
      <div className="setting"><span>Terms of Service</span><button onClick={() => onOpenLegal('terms')}>View</button></div>
    </section>
  );
}
