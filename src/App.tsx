import { useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Download, FolderOpen, Home, ScanLine, Share2, User, Wrench } from 'lucide-react';
import type { CropRect, DocItem, FilterKind, PageItem, ScanMode, SignatureItem, Tab } from './types';
import Brand from './components/Brand';
import PdfViewer from './components/PdfViewer';
import PageManager from './components/PageManager';
import ToolRunner from './components/ToolRunner';
import LegalModal from './components/LegalModal';
import HomePage from './pages/Home';
import ToolsPage from './pages/Tools';
import ScanPage from './pages/Scan';
import FilesPage from './pages/Files';
import ProfilePage from './pages/Profile';
import LockScreen from './pages/LockScreen';
import Login from './pages/Login';
import { dateStamp, fileToDataUrl } from './utils';
import { pagesToPdf } from './pdf/export';
import { listDocs, saveDoc, deleteDoc, addTombstone, removeTombstone, listSignatures, saveSignature, deleteSignature } from './db';
import { syncNow } from './sync';
import { toast } from './toast';
import Toaster from './components/Toaster';
import { pickFromGallery } from './capacitor/camera';
import { sharePdf, saveFileToDevice } from './capacitor/share';
import { hasPin } from './capacitor/lock';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { exchangeGoogleCode, getCurrentUser, signOut, type KuklabsUser } from './kuklabs/authClient';
import { useT } from './i18n';

const pathToTab: Record<string, Tab> = { '/': 'home', '/tools': 'tools', '/scan': 'scan', '/files': 'files', '/profile': 'profile' };
const tabToPath: Record<Tab, string> = { home: '/', tools: '/tools', scan: '/scan', files: '/files', profile: '/profile' };

// KukPDF is a scanner-first app: on a native cold launch, open straight to Scan
// and auto-start a fresh capture. On web (dev/preview) respect the URL path.
function initialTab(): Tab {
  if (Capacitor.isNativePlatform()) return 'scan';
  return pathToTab[window.location.pathname] ?? 'home';
}

const navItems = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'tools' as Tab, label: 'Tools', icon: Wrench },
  { id: 'scan' as Tab, label: 'Scan', icon: ScanLine },
  { id: 'files' as Tab, label: 'Files', icon: FolderOpen },
  { id: 'profile' as Tab, label: 'Profile', icon: User },
];

export default function App() {
  const t = useT();
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [mode, setMode] = useState<ScanMode>('Document');
  const [activeFilter, setActiveFilter] = useState<FilterKind>('Auto');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<DocItem | null>(null);
  const [editDoc, setEditDoc] = useState<DocItem | null>(null);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const [unlockedSecure, setUnlockedSecure] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null); // null = still checking
  const [user, setUser] = useState<KuklabsUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  // Fires the scanner once on a native cold launch (consumed after first run so
  // it never re-triggers on tab switches or resumes).
  const [autoScan, setAutoScan] = useState(Capacitor.isNativePlatform());
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Two-way cloud sync with the shared Kuklabs account. Silent for the auto
   * runs (login/resume); surfaces a short status line when triggered manually. */
  async function runSync(manual = false) {
    if (syncing) return;
    setSyncing(true);
    if (manual) setSyncMsg('Syncing…');
    try {
      const r = await syncNow();
      if (!r.skipped) setDocs(await listDocs());
      if (manual) {
        const msg = r.skipped ? 'Sign in to sync your documents.'
          : `Synced · ${r.uploaded} up · ${r.downloaded} down`;
        setSyncMsg(msg);
        toast(msg, { type: r.skipped ? 'info' : 'success' });
      }
    } catch (e: any) {
      if (manual) { setSyncMsg(e?.message || 'Sync failed. Try again.'); toast('Sync failed. Try again.', { type: 'error' }); }
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const onPop = () => setTabState(initialTab());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    listDocs().then(setDocs);
    listSignatures().then(setSignatures);
    hasPin().then((on) => setLocked(on));
    getCurrentUser().then((u) => { setUser(u); if (u) runSync(); });
  }, []);

  // Re-sync when the app returns to the foreground (if signed in).
  useEffect(() => {
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && user) runSync();
    });
    return () => { sub.then((s) => s.remove()); };
  }, [user]);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    toast('Signed out');
  }

  useEffect(() => {
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) hasPin().then((on) => { if (on) setLocked(true); });
    });
    return () => { sub.then((s) => s.remove()); };
  }, []);

  // Google sign-in deep-link return (kukpdf://auth?code=…) — KUKLABS_IDENTITY.md §3.1.
  useEffect(() => {
    const sub = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url?.startsWith('kukpdf://auth')) return;
      Browser.close().catch(() => {});
      try {
        const code = new URL(url).searchParams.get('code');
        if (!code) return;
        await exchangeGoogleCode(code);
        setUser(await getCurrentUser());
        setShowLogin(false);
        runSync();
      } catch (e) {
        console.error('Google sign-in exchange failed', e);
      }
    });
    return () => { sub.then((s) => s.remove()); };
  }, []);

  function setTab(next: Tab) {
    setTabState(next);
    const path = tabToPath[next];
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  }

  async function importImages(files: FileList | null) {
    if (!files?.length) return;
    const added: PageItem[] = [];
    for (const f of Array.from(files)) added.push({ id: crypto.randomUUID(), dataUrl: await fileToDataUrl(f), filter: activeFilter, rotation: 0 });
    setPages((p) => [...p, ...added]);
    setTab('scan');
  }

  function addPages(dataUrls: string[]) {
    const added: PageItem[] = dataUrls.map((dataUrl) => ({ id: crypto.randomUUID(), dataUrl, filter: activeFilter, rotation: 0 }));
    setPages((p) => [...p, ...added]);
  }

  async function importFromGallery() {
    const urls = await pickFromGallery(true);
    if (urls.length) { addPages(urls); setTab('scan'); }
    else fileRef.current?.click();
  }

  async function exportPdf() {
    if (!pages.length) return;
    setExporting(true);
    setExportError(null);
    try {
      const name = `${mode} ${dateStamp()}.pdf`;
      const blob = await pagesToPdf(pages);
      const doc: DocItem = { id: crypto.randomUUID(), name, kind: 'scan', pages, createdAt: Date.now(), size: blob.size, blob };
      await saveDoc(doc);
      setDocs((d) => [doc, ...d]);
      setPages([]);
      setTab('files');
      if (user) runSync();
      toast('PDF saved to Files');
    } catch (e: any) {
      console.error('exportPdf failed', e);
      setExportError(e?.message || 'Could not build the PDF. Try again with fewer pages.');
      toast('Could not save the PDF', { type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  /** Brings an existing PDF from the device's file manager into the app's document store. */
  async function importPdfFile(file: File): Promise<DocItem> {
    const doc: DocItem = { id: crypto.randomUUID(), name: file.name, kind: 'pdf', pages: [], createdAt: Date.now(), size: file.size, blob: file };
    await saveDoc(doc);
    setDocs((d) => [doc, ...d]);
    return doc;
  }

  function rotatePage(id: string) {
    setPages((p) => p.map((x) => (x.id === id ? { ...x, rotation: (x.rotation + 90) % 360 } : x)));
  }

  function deletePage(id: string) {
    setPages((p) => p.filter((x) => x.id !== id));
  }

  function setCrop(id: string, crop: CropRect | undefined) {
    setPages((p) => p.map((x) => (x.id === id ? { ...x, crop } : x)));
  }

  async function handleDocFromTool(doc: DocItem) {
    await saveDoc(doc);
    setDocs((d) => [doc, ...d]);
    if (user) runSync();
    toast('Saved to Files');
  }

  async function handleDeleteDoc(id: string) {
    const doc = docs.find((d) => d.id === id);
    await deleteDoc(id);
    await addTombstone(id); // propagate the delete to the account's other devices
    setDocs((d) => d.filter((x) => x.id !== id));
    if (user) runSync();
    // Undo guards against accidental data loss (audit UX gap).
    toast('Document deleted', {
      type: 'info',
      action: doc ? { label: t('common.undo'), onClick: async () => {
        await saveDoc(doc);
        await removeTombstone(id);
        setDocs(await listDocs());
        if (user) runSync();
        toast('Document restored');
      } } : undefined,
    });
  }

  async function handleToggleFavorite(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    const next = { ...doc, favorite: !doc.favorite };
    await saveDoc(next);
    setDocs((d) => d.map((x) => (x.id === id ? next : x)));
  }

  async function handleToggleSecure(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    const next = { ...doc, secure: !doc.secure };
    await saveDoc(next);
    setDocs((d) => d.map((x) => (x.id === id ? next : x)));
  }

  async function handleRenameDoc(id: string, name: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    const next = { ...doc, name, updatedAt: Date.now() };
    await saveDoc(next);
    setDocs((d) => d.map((x) => (x.id === id ? next : x)));
    if (user) runSync();
  }

  async function handleBulkDelete(ids: string[]) {
    const removed = docs.filter((d) => ids.includes(d.id));
    for (const id of ids) { await deleteDoc(id); await addTombstone(id); }
    setDocs((d) => d.filter((x) => !ids.includes(x.id)));
    if (user) runSync();
    toast(`${removed.length} document${removed.length === 1 ? '' : 's'} deleted`, {
      type: 'info',
      action: {
        label: t('common.undo'),
        onClick: async () => {
          for (const doc of removed) { await saveDoc(doc); await removeTombstone(doc.id); }
          setDocs(await listDocs());
          if (user) runSync();
          toast('Documents restored');
        },
      },
    });
  }

  async function handleSaveSignature(sig: SignatureItem) {
    await saveSignature(sig);
    setSignatures((s) => [sig, ...s]);
  }

  async function handleDeleteSignature(id: string) {
    await deleteSignature(id);
    setSignatures((s) => s.filter((x) => x.id !== id));
  }

  if (locked === null) return null;
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        {navItems.map((n) => (
          <button key={n.id} className={tab === n.id ? 'nav active' : 'nav'} onClick={() => setTab(n.id)}>
            <n.icon size={20} />{n.label}
          </button>
        ))}
      </aside>
      <main>
        {tab === 'home' && (
          <HomePage setTab={setTab} docs={docs} onOpenTool={setActiveTool} onOpenDoc={setViewerDoc} />
        )}
        {tab === 'tools' && <ToolsPage setTab={setTab} onOpenTool={setActiveTool} />}
        {tab === 'scan' && (
          <ScanPage
            pages={pages}
            mode={mode}
            setMode={setMode}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            addPages={addPages}
            exportPdf={exportPdf}
            rotatePage={rotatePage}
            deletePage={deletePage}
            setCrop={setCrop}
            exporting={exporting}
            exportError={exportError}
            onImportPhotos={importFromGallery}
            onImportPdf={async (file) => { await importPdfFile(file); setTab('files'); }}
            autoStart={autoScan}
            onAutoStartDone={() => setAutoScan(false)}
          />
        )}
        {tab === 'files' && (
          <FilesPage
            docs={docs}
            onOpen={setViewerDoc}
            onDelete={handleDeleteDoc}
            onBulkDelete={handleBulkDelete}
            onToggleFavorite={handleToggleFavorite}
            onToggleSecure={handleToggleSecure}
            onRename={handleRenameDoc}
            onEdit={setEditDoc}
            unlockedSecure={unlockedSecure}
            onImportPdf={importPdfFile}
          />
        )}
        {tab === 'profile' && (
          <ProfilePage
            docs={docs}
            signatures={signatures}
            user={user}
            onSignIn={() => setShowLogin(true)}
            onSignOut={handleSignOut}
            onDeleteSignature={handleDeleteSignature}
            onUnlockSecure={() => setUnlockedSecure(true)}
            setTab={setTab}
            onOpenLegal={setLegalDoc}
            onSync={() => runSync(true)}
            syncing={syncing}
            syncMsg={syncMsg}
          />
        )}
      </main>
      <nav className="bottom">
        {navItems.map((n) => (
          <button
            key={n.id}
            className={`${tab === n.id ? 'active' : ''}${n.id === 'scan' ? ' scan-fab' : ''}`}
            onClick={() => setTab(n.id)}
            aria-label={t(`nav.${n.id}`)}
          >
            <n.icon size={20} /><span>{t(`nav.${n.id}`)}</span>
          </button>
        ))}
      </nav>
      <input ref={fileRef} hidden type="file" accept="image/*" multiple onChange={(e) => importImages(e.target.files)} />

      {activeTool && (
        <ToolRunner
          tool={activeTool}
          docs={docs}
          signatures={signatures}
          onDone={handleDocFromTool}
          onCancel={() => setActiveTool(null)}
          onSaveSignature={handleSaveSignature}
          onImportPdf={importPdfFile}
        />
      )}
      {viewerDoc && (
        <div className="modal">
          <div className="sheet viewer-sheet">
            <div className="viewer-header">
              <b>{viewerDoc.name}</b>
              <div className="viewer-actions">
                <button className="viewer-icon-btn" title="Share" aria-label="Share"
                  onClick={() => { sharePdf(viewerDoc.blob, viewerDoc.name).catch(() => {}); }}>
                  <Share2 size={18} />
                </button>
                <button className="viewer-icon-btn" title="Download" aria-label="Download"
                  onClick={async () => { try { toast(await saveFileToDevice(viewerDoc.blob, viewerDoc.name)); } catch (e: any) { toast(e?.message || 'Could not save the file', { type: 'error' }); } }}>
                  <Download size={18} />
                </button>
                <button onClick={() => setViewerDoc(null)}>Close</button>
              </div>
            </div>
            <PdfViewer blob={viewerDoc.blob} />
          </div>
        </div>
      )}
      {editDoc && (
        <EditPagesModal
          doc={editDoc}
          onCancel={() => setEditDoc(null)}
          onSave={async (bytes) => {
            const name = `${editDoc.name.replace(/\.pdf$/i, '')} (edited).pdf`;
            const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
            handleDocFromTool({ id: crypto.randomUUID(), name, kind: 'pdf', pages: [], createdAt: Date.now(), size: blob.size, blob });
            setEditDoc(null);
          }}
        />
      )}
      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}
      <Toaster />
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onDone={async () => { setUser(await getCurrentUser()); setShowLogin(false); runSync(); }}
        />
      )}
    </div>
  );
}

/** Loads a doc's bytes then mounts the page editor (reorder / rotate / delete pages). */
function EditPagesModal({ doc, onCancel, onSave }: { doc: DocItem; onCancel: () => void; onSave: (bytes: Uint8Array) => void }) {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  useEffect(() => {
    let cancelled = false;
    doc.blob.arrayBuffer().then((b) => { if (!cancelled) setBytes(new Uint8Array(b)); });
    return () => { cancelled = true; };
  }, [doc]);
  if (!bytes) return <div className="modal"><div className="sheet"><p className="viewer-status">Loading…</p></div></div>;
  return <PageManager bytes={bytes} onCancel={onCancel} onSave={onSave} />;
}
