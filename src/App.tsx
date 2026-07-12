import { useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { FolderOpen, Home, ScanLine, User, Wrench } from 'lucide-react';
import type { CropRect, DocItem, FilterKind, PageItem, ScanMode, SignatureItem, Tab } from './types';
import Brand from './components/Brand';
import PdfViewer from './components/PdfViewer';
import ToolRunner from './components/ToolRunner';
import LegalModal from './components/LegalModal';
import HomePage from './pages/Home';
import ToolsPage from './pages/Tools';
import ScanPage from './pages/Scan';
import FilesPage from './pages/Files';
import ProfilePage from './pages/Profile';
import LockScreen from './pages/LockScreen';
import { dateStamp, fileToDataUrl } from './utils';
import { pagesToPdf } from './pdf/export';
import { listDocs, saveDoc, deleteDoc, listSignatures, saveSignature, deleteSignature } from './db';
import { pickFromGallery } from './capacitor/camera';
import { hasPin } from './capacitor/lock';

const pathToTab: Record<string, Tab> = { '/': 'home', '/tools': 'tools', '/scan': 'scan', '/files': 'files', '/profile': 'profile' };
const tabToPath: Record<Tab, string> = { home: '/', tools: '/tools', scan: '/scan', files: '/files', profile: '/profile' };

function initialTab(): Tab {
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
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const [unlockedSecure, setUnlockedSecure] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null); // null = still checking
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPop = () => setTabState(initialTab());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    listDocs().then(setDocs);
    listSignatures().then(setSignatures);
    hasPin().then((on) => setLocked(on));
  }, []);

  useEffect(() => {
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) hasPin().then((on) => { if (on) setLocked(true); });
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
    } catch (e: any) {
      console.error('exportPdf failed', e);
      setExportError(e?.message || 'Could not build the PDF. Try again with fewer pages.');
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
  }

  async function handleDeleteDoc(id: string) {
    await deleteDoc(id);
    setDocs((d) => d.filter((x) => x.id !== id));
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
          <HomePage setTab={setTab} docs={docs} onImportClick={importFromGallery} onOpenTool={setActiveTool} onOpenDoc={setViewerDoc} />
        )}
        {tab === 'tools' && <ToolsPage setTab={setTab} onOpenTool={setActiveTool} />}
        {tab === 'scan' && (
          <ScanPage
            pages={pages}
            mode={mode}
            setMode={setMode}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            fileRef={fileRef}
            importImages={importImages}
            addPages={addPages}
            exportPdf={exportPdf}
            rotatePage={rotatePage}
            deletePage={deletePage}
            setCrop={setCrop}
            exporting={exporting}
            exportError={exportError}
          />
        )}
        {tab === 'files' && (
          <FilesPage
            docs={docs}
            onOpen={setViewerDoc}
            onDelete={handleDeleteDoc}
            onToggleFavorite={handleToggleFavorite}
            onToggleSecure={handleToggleSecure}
            unlockedSecure={unlockedSecure}
            onImportPdf={importPdfFile}
          />
        )}
        {tab === 'profile' && (
          <ProfilePage
            docs={docs}
            signatures={signatures}
            onDeleteSignature={handleDeleteSignature}
            onUnlockSecure={() => setUnlockedSecure(true)}
            setTab={setTab}
            onOpenLegal={setLegalDoc}
          />
        )}
      </main>
      <nav className="bottom">
        {navItems.map((n) => (
          <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}>
            <n.icon size={20} /><span>{n.label}</span>
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
            <div className="viewer-header"><b>{viewerDoc.name}</b><button onClick={() => setViewerDoc(null)}>Close</button></div>
            <PdfViewer blob={viewerDoc.blob} />
          </div>
        </div>
      )}
      {legalDoc && <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}
