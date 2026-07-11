import { Search, ScanLine, Upload } from 'lucide-react';
import type { DocItem, Tab } from '../types';
import Header from '../components/Header';
import ToolCard from '../components/ToolCard';
import FileRow from '../components/FileRow';

const quick = ['Scan to PDF', 'Image to PDF', 'Merge PDF', 'Compress PDF', 'Sign PDF', 'Image to Text'];

export default function HomePage({ setTab, docs, onImportClick, onOpenTool, onOpenDoc }: {
  setTab: (t: Tab) => void;
  docs: DocItem[];
  onImportClick: () => void;
  onOpenTool: (tool: string) => void;
  onOpenDoc: (doc: DocItem) => void;
}) {
  return (
    <section>
      <Header title="KukPDF" sub="Smart PDF Scanner & Tools · A Kuklabs Product" />
      <div className="search"><Search size={18} /><input placeholder="Search files, tools…" /></div>
      <button className="hero" onClick={() => setTab('scan')}>
        <ScanLine size={34} />
        <div><b>Scan a document</b><p>Crop · Filters · Multi-page PDF export</p></div>
      </button>
      <h2>Quick tools</h2>
      <div className="grid">
        {quick.map((t) => (
          <ToolCard key={t} label={t} onClick={() => (t === 'Scan to PDF' ? setTab('scan') : onOpenTool(t))} />
        ))}
      </div>
      <h2>Recent files</h2>
      <div className="list">
        {docs.length === 0 && <p className="viewer-status">No documents yet.</p>}
        {docs.slice(0, 3).map((d) => <FileRow key={d.id} d={d} onOpen={() => onOpenDoc(d)} />)}
      </div>
      <button className="primary wide" onClick={onImportClick}><Upload size={18} /> Import images</button>
    </section>
  );
}
