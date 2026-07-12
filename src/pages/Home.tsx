import { useState } from 'react';
import { Search } from 'lucide-react';
import type { DocItem, Tab } from '../types';
import Header from '../components/Header';
import ToolCard from '../components/ToolCard';
import FileRow from '../components/FileRow';
import { ALL_TOOLS } from './Tools';

const quick = ['Image to PDF', 'Merge PDF', 'Compress PDF', 'Sign PDF', 'Image to Text', 'Password Protect'];

export default function HomePage({ setTab, docs, onOpenTool, onOpenDoc }: {
  setTab: (t: Tab) => void;
  docs: DocItem[];
  onOpenTool: (tool: string) => void;
  onOpenDoc: (doc: DocItem) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const matchedDocs = searching ? docs.filter((d) => !d.trashed && d.name.toLowerCase().includes(q)) : [];
  const matchedTools = searching ? ALL_TOOLS.filter((t) => t.toLowerCase().includes(q)) : [];

  return (
    <section>
      <Header title="KukPDF" sub="Smart PDF Scanner & Tools · A Kuklabs Product" />
      <div className="search">
        <Search size={18} />
        <input placeholder="Search files, tools…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {searching ? (
        <>
          <h2>Tools ({matchedTools.length})</h2>
          <div className="grid">
            {matchedTools.length === 0 && <p className="viewer-status">No matching tools.</p>}
            {matchedTools.map((t) => (
              <ToolCard key={t} label={t} onClick={() => (t === 'Scan to PDF' ? setTab('scan') : t === 'Secure Folder' ? setTab('profile') : onOpenTool(t))} />
            ))}
          </div>
          <h2>Files ({matchedDocs.length})</h2>
          <div className="list">
            {matchedDocs.length === 0 && <p className="viewer-status">No matching files.</p>}
            {matchedDocs.map((d) => <FileRow key={d.id} d={d} onOpen={() => onOpenDoc(d)} />)}
          </div>
        </>
      ) : (
        <>
          <h2>Quick tools</h2>
          <div className="grid">
            {quick.map((t) => (
              <ToolCard key={t} label={t} onClick={() => (t === 'Scan to PDF' ? setTab('scan') : t === 'Secure Folder' ? setTab('profile') : onOpenTool(t))} />
            ))}
          </div>
          <h2>Recent files</h2>
          <div className="list">
            {docs.length === 0 && <p className="viewer-status">No documents yet — tap the scan button below to start.</p>}
            {docs.slice(0, 3).map((d) => <FileRow key={d.id} d={d} onOpen={() => onOpenDoc(d)} />)}
          </div>
        </>
      )}
    </section>
  );
}
