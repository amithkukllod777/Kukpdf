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
import { Browser } from '@capacitor/browser';
import { AUTH_BASE } from '../kuklabs/authClient';
import { getAiQuota, type AiQuota } from '../kuklabs/aiClient';
import { deleteAllRemoteDocs } from '../kuklabs/syncClient';
import { requestAccountDeletion, getDeletionStatus } from '../kuklabs/accountClient';
import { deleteDoc } from '../db';
import { useI18n } from '../i18n';

const PRO_PLANS = new Set(['premium', 'business']);

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
  const { t, lang, setLang } = useI18n();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [mode, setMode] = useState<'idle' | 'set' | 'unlock'>('idle');
  const [msg, setMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [quota, setQuota] = useState<AiQuota | null>(null);

  useEffect(() => { hasPin().then(setPinEnabled); }, []);
  // Real plan + AI quota from the shared backend (best-effort; only when signed in).
  useEffect(() => {
    let alive = true;
    if (!user) { setQuota(null); return; }
    getAiQuota().then((q) => { if (alive) setQuota(q); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);

  const isPro = !!quota && PRO_PLANS.has(quota.plan);
  async function openPricing() { await Browser.open({ url: `${AUTH_BASE}/pdf/pricing` }); }

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Play/GDPR "delete my data": wipe every local document + signature, and (if
   * signed in) erase the account's KukPDF cloud documents, then sign out. Full
   * Kuklabs-account deletion (across all Kuk apps) is a separate account-level flow. */
  async function deleteMyData() {
    setDeleting(true);
    try {
      if (user) { try { await deleteAllRemoteDocs(); } catch { /* still wipe locally */ } }
      for (const d of docs) { try { await deleteDoc(d.id); } catch { /* continue */ } }
      for (const s of signatures) { try { onDeleteSignature(s.id); } catch { /* continue */ } }
      // Deleting *data* keeps the account signed in; reload so App re-reads the
      // now-empty local store (props are owned by App).
      window.location.reload();
    } catch {
      toast('Could not delete everything — try again', { type: 'error' });
      setDeleting(false);
    }
  }
  // Account deletion is a REQUEST, not an in-app hard delete: the Kuklabs Account
  // is shared across every Kuk app, so the team removes it and emails the user a
  // confirmation. (Deleting KukPDF *documents* is the separate "delete my data".)
  const [reqConfirm, setReqConfirm] = useState(false);
  const [reqSending, setReqSending] = useState(false);
  const [reqPending, setReqPending] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!user) { setReqPending(false); return; }
    getDeletionStatus().then((s) => { if (alive) setReqPending(s.pending); }).catch(() => {});
    return () => { alive = false; };
  }, [user]);
  async function submitAccountDeletion() {
    setReqSending(true);
    try {
      await requestAccountDeletion();
      setReqPending(true);
      setReqConfirm(false);
      toast(t('profile.reqDeleteDone'));
    } catch (e: any) {
      toast(e?.message || 'Could not submit your request. Please try again.', { type: 'error' });
    } finally {
      setReqSending(false);
    }
  }

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
            <b>{t('profile.signInKuklabs')}</b>
            <span>{t('profile.oneAccount')}</span>
          </div>
          <ChevronRight className="go" size={20} />
        </button>
      )}

      <div className="card pro">
        <Sparkles /><b> {t('profile.pro')}</b>
        {!user ? (
          <p>Sign in to your Kuklabs account to use AI tools and unlock Pro. Free accounts get a daily AI trial.</p>
        ) : isPro ? (
          <>
            <p>You're on <b>{quota!.plan === 'business' ? 'Business' : 'Premium'}</b> — AI tools, batch and server tools unlocked.
              {quota!.limit < 1_000_000 && <> {quota!.remaining} of {quota!.limit} AI calls left today.</>}
            </p>
          </>
        ) : (
          <>
            <p>AI tools (Summarize &amp; Ask PDF) are on your free daily trial{quota ? <> — <b>{quota.remaining} of {quota.limit}</b> left today</> : null}. Upgrade for a much higher daily limit, batch and server tools.</p>
            <button className="wide" onClick={openPricing}>{t('profile.upgrade')}</button>
          </>
        )}
      </div>

      <h2>{t('profile.language')}</h2>
      <div className="card">
        <div className="chips" style={{ padding: 0 }}>
          <button className={lang === 'en' ? 'chip active' : 'chip'} onClick={() => setLang('en')}>English</button>
          <button className={lang === 'hi' ? 'chip active' : 'chip'} onClick={() => setLang('hi')}>हिन्दी</button>
        </div>
      </div>

      {user && (
        <>
          <h2>{t('profile.cloudSync')}</h2>
          <div className="card sync-card">
            <div className="sync-head">
              <span className="sync-ico"><CloudUpload size={18} /></span>
              <div className="tx">
                <b>{t('profile.backupSync')}</b>
                <span>Your PDFs sync to your Kuklabs account across devices.</span>
              </div>
            </div>
            <button className="wide" disabled={syncing} onClick={onSync}>{syncing ? t('profile.syncing') : t('profile.syncNow')}</button>
            {syncMsg && <p className="viewer-status">{syncMsg}</p>}
          </div>
        </>
      )}

      <h2>{t('profile.security')}</h2>
      <div className="card">
        {!pinEnabled && mode === 'idle' && (
          <>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> {t('profile.appLockOff')}</p>
            <button onClick={() => setMode('set')}>{t('profile.setPin')}</button>
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
            <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> {t('profile.appLockOn')}</p>
            <div className="actions">
              <button onClick={() => setMode('unlock')}>{t('profile.unlockSecure')}</button>
              <button onClick={async () => { await clearPin(); setPinEnabled(false); setMsg('App PIN removed.'); }}>{t('profile.removePin')}</button>
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

      <h2>{t('profile.savedSignatures')}</h2>
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

      <h2>{t('profile.about')}</h2>
      <div className="setting"><span>{t('profile.docsOnDevice')}</span><span style={{ fontWeight: 700 }}>{docs.length}</span></div>
      <div className="setting"><span>{t('profile.privacy')}</span><button onClick={() => onOpenLegal('privacy')}>{t('common.view')}</button></div>
      <div className="setting"><span>{t('profile.terms')}</span><button onClick={() => onOpenLegal('terms')}>{t('common.view')}</button></div>
      <div className="setting"><span>{t('profile.export')}</span><button disabled={exporting} onClick={exportData}>{exporting ? t('profile.exporting') : 'Export .zip'}</button></div>
      <div className="setting"><span>{t('profile.support')}</span><a href="mailto:support@kuklabs.com?subject=KukPDF%20support">{t('profile.contact')}</a></div>

      <h2>{t('profile.deleteData')}</h2>
      <div className="card">
        {!confirmDelete ? (
          <>
            <p className="viewer-status">Permanently deletes all your KukPDF documents on this device{user ? ' and in your Kuklabs cloud' : ''}. This can't be undone.</p>
            <button className="wide" style={{ color: 'var(--error)', fontWeight: 600 }} onClick={() => setConfirmDelete(true)}>{t('profile.deleteMyKukpdf')}</button>
            {user && (
              reqPending ? (
                <p className="viewer-status" style={{ marginTop: 8 }}>{t('profile.reqDeletePending')}</p>
              ) : reqConfirm ? (
                <>
                  <p className="viewer-status" style={{ marginTop: 8 }}>{t('profile.reqDeleteConfirm')}</p>
                  <div className="actions">
                    <button onClick={() => setReqConfirm(false)} disabled={reqSending}>Cancel</button>
                    <button style={{ color: 'var(--error)', fontWeight: 600 }} disabled={reqSending} onClick={submitAccountDeletion}>
                      {reqSending ? t('profile.reqDeleteSending') : t('profile.reqDeleteCta')}
                    </button>
                  </div>
                </>
              ) : (
                <button className="link-btn" onClick={() => setReqConfirm(true)} style={{ marginTop: 8 }}>{t('profile.deleteAccount')}</button>
              )
            )}
          </>
        ) : (
          <>
            <p className="viewer-status error">Delete all your KukPDF documents{user ? ' (device + cloud)' : ''}? This can't be undone.</p>
            <div className="actions">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button style={{ background: 'var(--error)', color: '#fff' }} disabled={deleting} onClick={deleteMyData}>{deleting ? t('profile.deleting') : t('profile.deleteConfirm')}</button>
            </div>
          </>
        )}
      </div>

      {user && (
        <button className="wide" style={{ background: 'transparent', color: 'var(--error)', fontWeight: 600, minHeight: 48, marginTop: 8 }} onClick={onSignOut}>
          {t('profile.signOut')}
        </button>
      )}

      {/* Version — Kuklabs App Version Display Policy: bottom-most muted,
          centre-aligned footer only; never on auth screens; no channel/commit. */}
      <p className="powered">Powered by <b>Kuklabs</b></p>
      <p className="about-version">{versionLabel}</p>
    </section>
  );
}
