import { useEffect, useRef, useState } from 'react';
import { Camera, Combine, FileText, FolderOpen, Home, ImagePlus, KeyRound, Lock, Minimize2, RotateCw, ScanLine, Search, Settings, ShieldCheck, Signature, Sparkles, Star, Trash2, Upload, User, Wrench } from 'lucide-react';
import type { DocItem, FilterKind, PageItem, ScanMode, Tab } from './types';
import { downloadBlob, fileToDataUrl, filterCss, filters, formatBytes, modes, pagesToPdf } from './utils';

const pathToTab: Record<string, Tab> = {
  '/': 'home',
  '/tools': 'tools',
  '/scan': 'scan',
  '/files': 'files',
  '/profile': 'profile',
};
const tabToPath: Record<Tab, string> = {
  home: '/',
  tools: '/tools',
  scan: '/scan',
  files: '/files',
  profile: '/profile',
};

const toolGroups = [
  ['Create', ['Scan to PDF', 'Image to PDF', 'JPG to PDF']],
  ['Organize', ['Merge PDF', 'Split PDF', 'Rotate PDF', 'Delete Pages', 'Reorder Pages']],
  ['Optimize', ['Compress PDF', 'Repair PDF']],
  ['Edit', ['Sign PDF', 'Watermark', 'Page Numbers', 'Annotate']],
  ['OCR & AI', ['Image to Text', 'Searchable PDF', 'Summarize PDF', 'Ask PDF']],
  ['Security', ['Password Protect', 'Unlock PDF', 'Secure Folder']],
] as const;

const toolIcon: Record<string, any> = {
  'Scan to PDF': ScanLine,
  'Image to PDF': ImagePlus,
  'JPG to PDF': ImagePlus,
  'Merge PDF': Combine,
  'Split PDF': Wrench,
  'Rotate PDF': RotateCw,
  'Delete Pages': Trash2,
  'Reorder Pages': Combine,
  'Compress PDF': Minimize2,
  'Repair PDF': Wrench,
  'Sign PDF': Signature,
  Watermark: ShieldCheck,
  'Page Numbers': FileText,
  Annotate: Settings,
  'Image to Text': Search,
  'Searchable PDF': Search,
  'Summarize PDF': Sparkles,
  'Ask PDF': Sparkles,
  'Password Protect': KeyRound,
  'Unlock PDF': Lock,
  'Secure Folder': ShieldCheck,
};

function seedDocs(): DocItem[] {
  const now = Date.now();
  return [
    { id: '1', name: 'Passport scan.pdf', kind: 'scan', pages: [], createdAt: now - 3600000, favorite: true, size: 842000 },
    { id: '2', name: 'Grocery receipt.pdf', kind: 'scan', pages: [], createdAt: now - 86400000, size: 214000 },
    { id: '3', name: 'Contract v3.pdf', kind: 'pdf', pages: [], createdAt: now - 432000000, size: 1204000 },
  ];
}

function initialTab(): Tab {
  return pathToTab[window.location.pathname] ?? 'home';
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [docs, setDocs] = useState<DocItem[]>(seedDocs);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [mode, setMode] = useState<ScanMode>('Document');
  const [activeFilter, setActiveFilter] = useState<FilterKind>('Auto');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPop = () => setTabState(initialTab());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
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

  async function exportPdf() {
    if (!pages.length) return alert('Add at least one page first');
    const name = `${mode} ${new Date().toLocaleDateString()}.pdf`;
    const blob = await pagesToPdf(pages);
    downloadBlob(blob, name);
    setDocs([{ id: crypto.randomUUID(), name, kind: 'scan', pages, createdAt: Date.now(), size: Math.round(blob.size) }, ...docs]);
    setPages([]);
    setTab('files');
  }

  function rotatePage(id: string) {
    setPages((p) => p.map((x) => x.id === id ? { ...x, rotation: (x.rotation + 90) % 360 } : x));
  }

  function deletePage(id: string) {
    setPages((p) => p.filter((x) => x.id !== id));
    setSelectedPage(null);
  }

  return <div className="app">
    <aside className="sidebar"><Brand />{navItems.map((n) => <button key={n.id} className={tab === n.id ? 'nav active' : 'nav'} onClick={() => setTab(n.id)}><n.icon size={20}/>{n.label}</button>)}</aside>
    <main>
      {tab === 'home' && <HomePage setTab={setTab} docs={docs} fileRef={fileRef} />}
      {tab === 'tools' && <ToolsPage setTab={setTab} />}
      {tab === 'scan' && <ScanPage pages={pages} mode={mode} setMode={setMode} activeFilter={activeFilter} setActiveFilter={setActiveFilter} fileRef={fileRef} importImages={importImages} exportPdf={exportPdf} rotatePage={rotatePage} deletePage={deletePage} selectedPage={selectedPage} setSelectedPage={setSelectedPage}/>} 
      {tab === 'files' && <FilesPage docs={docs} setDocs={setDocs} />}
      {tab === 'profile' && <ProfilePage docs={docs} />}
    </main>
    <nav className="bottom">{navItems.map((n) => <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}><n.icon size={20}/><span>{n.label}</span></button>)}</nav>
    <input ref={fileRef} hidden type="file" accept="image/*" multiple onChange={(e) => importImages(e.target.files)} />
  </div>;
}

const navItems = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'tools' as Tab, label: 'Tools', icon: Wrench },
  { id: 'scan' as Tab, label: 'Scan', icon: ScanLine },
  { id: 'files' as Tab, label: 'Files', icon: FolderOpen },
  { id: 'profile' as Tab, label: 'Profile', icon: User },
];

function Brand() { return <div className="brand"><div className="logo"><img src="/kuklabs-mark.svg" alt="Kuklabs" /></div><b>Kuk<span>PDF</span></b></div>; }
function Header({ title, sub }: { title: string; sub?: string }) { return <header><h1>{title}</h1>{sub && <p>{sub}</p>}</header>; }

function HomePage({ setTab, docs, fileRef }: any) {
  const quick = ['Scan to PDF', 'Image to PDF', 'Merge PDF', 'Compress PDF', 'Sign PDF', 'Image to Text'];
  return <section><Header title="KukPDF" sub="Smart PDF Scanner & Tools · A Kuklabs Product" />
    <div className="search"><Search size={18}/><input placeholder="Search files, tools…" /></div>
    <button className="hero" onClick={() => setTab('scan')}><ScanLine size={34}/><div><b>Scan a document</b><p>Auto crop · Multi-page · PDF export</p></div></button>
    <h2>Quick tools</h2><div className="grid">{quick.map((t) => <ToolCard key={t} label={t} onClick={() => t.includes('Scan') ? setTab('scan') : setTab('tools')} />)}</div>
    <h2>Recent files</h2><div className="list">{docs.slice(0,3).map((d: DocItem) => <FileRow key={d.id} d={d} />)}</div>
    <button className="primary wide" onClick={() => fileRef.current?.click()}><Upload size={18}/> Import images</button>
  </section>;
}

function ToolsPage({ setTab }: { setTab: (t: Tab) => void }) {
  return <section><Header title="PDF Tools" sub="Create, organize, optimize, edit, OCR and secure PDFs" />
    {toolGroups.map(([group, tools]) => <div key={group}><h2>{group}</h2><div className="grid">{tools.map((t) => <ToolCard key={t} label={t} onClick={() => t === 'Scan to PDF' ? setTab('scan') : alert(`${t}: UI ready, backend/native processing next`)} />)}</div></div>)}
  </section>;
}

function ScanPage(props: any) {
  const selected = props.pages.find((p: PageItem) => p.id === props.selectedPage);
  return <section><Header title="Scan" sub="Document · ID Card · Book · Receipt · QR" />
    <div className="camera"><div className="frame"><ScanLine size={56}/><p>Camera preview / upload fallback</p><small>Native Android CameraX will replace this PWA placeholder.</small></div></div>
    <div className="chips">{modes.map((m) => <button key={m} className={props.mode === m ? 'chip active' : 'chip'} onClick={() => props.setMode(m)}>{m}</button>)}</div>
    <div className="capture"><button onClick={() => props.fileRef.current?.click()}><ImagePlus/>Import</button><button className="shutter" onClick={() => props.fileRef.current?.click()}><Camera/></button><button onClick={props.exportPdf}><FileText/>PDF</button></div>
    <div className="chips">{filters.map((f) => <button key={f} className={props.activeFilter === f ? 'chip active' : 'chip'} onClick={() => props.setActiveFilter(f)}>{f}</button>)}</div>
    <h2>Pages ({props.pages.length})</h2><div className="pages">{props.pages.map((p: PageItem, i: number) => <button key={p.id} onClick={() => props.setSelectedPage(p.id)}><img src={p.dataUrl} style={{filter: filterCss(p.filter), transform: `rotate(${p.rotation}deg)`}}/><span>{i+1}</span></button>)}</div>
    {selected && <div className="modal"><div className="sheet"><img src={selected.dataUrl} style={{filter: filterCss(selected.filter), transform: `rotate(${selected.rotation}deg)`}}/><div className="actions"><button onClick={() => props.rotatePage(selected.id)}><RotateCw/>Rotate</button><button onClick={() => props.deletePage(selected.id)}><Trash2/>Delete</button><button onClick={() => props.setSelectedPage(null)}>Done</button></div></div></div>}
  </section>;
}

function FilesPage({ docs, setDocs }: any) {
  return <section><Header title="Files" sub={`${docs.filter((d: DocItem) => !d.trashed).length} documents`} />
    <div className="tabs"><button>All</button><button>Scanned</button><button>PDFs</button><button>Favorites</button><button>Secure</button></div>
    <div className="list">{docs.filter((d: DocItem) => !d.trashed).map((d: DocItem) => <FileRow key={d.id} d={d} setDocs={setDocs} docs={docs}/>)}</div>
  </section>;
}

function ProfilePage({ docs }: { docs: DocItem[] }) {
  return <section><Header title="Profile" sub="Kuklabs Inc. · kuklabs.com" />
    <div className="card brand-card"><img src="/kuklabs-mark.svg" alt="Kuklabs" /><div><b>KukPDF</b><p>Smart PDF Scanner & Tools</p><small>A Kuklabs Product</small></div></div>
    <div className="card pro"><Sparkles/><b>KukPDF Pro</b><p>Unlimited scans, batch OCR, cloud sync, no watermark.</p><button>Upgrade</button></div>
    <div className="card"><b>Usage</b><p>{docs.length}/20 free monthly scans used</p><progress value={docs.length} max={20}/></div>
    {['Company: Kuklabs Inc.', 'Website: kuklabs.com', 'Developer: Kuklabs Inc.', 'Default scan quality: High', 'Default filter: Auto', 'Auto OCR: Off', 'Cloud sync: Off', 'App lock: Off'].map(x => <div className="setting" key={x}><span>{x}</span><button>Change</button></div>)}
  </section>;
}

function ToolCard({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = toolIcon[label] || FileText;
  return <button className="tool" onClick={onClick}><Icon size={22}/><span>{label}</span></button>;
}

function FileRow({ d, docs, setDocs }: { d: DocItem; docs?: DocItem[]; setDocs?: any }) {
  return <div className="file"><FileText/><div><b>{d.name}</b><p>{formatBytes(d.size)} · {new Date(d.createdAt).toLocaleDateString()}</p></div>{d.favorite && <Star size={16}/>} {setDocs && <button onClick={() => setDocs(docs!.map(x => x.id === d.id ? {...x, trashed: true} : x))}><Trash2 size={16}/></button>}</div>;
}
