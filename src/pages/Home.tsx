import { useState } from 'react';
import {
  Crown, FileText, Files, Layers, Lock, Minimize2, Pencil, RefreshCw, Scissors, Search,
} from 'lucide-react';
import type { DocItem, Tab } from '../types';
import ToolCard from '../components/ToolCard';
import FileRow from '../components/FileRow';
import { ALL_TOOLS } from './Tools';

/**
 * Home — matches the official KukPDF product screen: "KukPDF" wordmark + Pro
 * crown, search, a colourful Quick Tools grid, and Recent Files. Each tool
 * routes to a REAL feature (no placeholders). The Kuklabs single-accent rule
 * still governs auth + profile; this product home uses per-tool colour coding.
 */
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

  const quickTools = [
    { label: 'View & Read', icon: FileText, color: '#2563EB', run: () => setTab('files') },
    { label: 'Edit PDF', icon: Pencil, color: '#EC4899', run: () => setTab('tools') },
    { label: 'Convert PDF', icon: RefreshCw, color: '#10B981', run: () => onOpenTool('Image to PDF') },
    { label: 'Merge PDF', icon: Layers, color: '#8B5CF6', run: () => onOpenTool('Merge PDF') },
    { label: 'Split PDF', icon: Scissors, color: '#F97316', run: () => onOpenTool('Split PDF') },
    { label: 'Compress PDF', icon: Minimize2, color: '#3B82F6', run: () => onOpenTool('Compress PDF') },
    { label: 'Protect PDF', icon: Lock, color: '#F59E0B', run: () => onOpenTool('Password Protect') },
    { label: 'Organize Pages', icon: Files, color: '#22C55E', run: () => onOpenTool('Reorder Pages') },
  ];

  const recent = docs.filter((d) => !d.trashed).slice(0, 4);

  // Render a tool label with the word "PDF" in the brand red, matching the wordmark.
  const pdfLabel = (s: string) => {
    const i = s.indexOf('PDF');
    if (i < 0) return s;
    return <>{s.slice(0, i)}<span className="pdf-red">PDF</span>{s.slice(i + 3)}</>;
  };

  return (
    <section>
      <div className="home-top">
        <h1 className="home-word"><span className="k">Kuk</span><span className="p">PDF</span></h1>
        <button className="home-crown" aria-label="KukPDF Pro" onClick={() => setTab('profile')}>
          <Crown size={22} />
        </button>
      </div>

      <div className="search">
        <Search size={18} />
        <input placeholder="Search PDF" value={query} onChange={(e) => setQuery(e.target.value)} />
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
          <h2 className="home-h2">Quick Tools</h2>
          <div className="qt-grid">
            {quickTools.map((t) => (
              <button key={t.label} className="qt-card" onClick={t.run}>
                <span className="qt-ico" style={{ background: `${t.color}1a`, color: t.color }}>
                  <t.icon size={24} />
                </span>
                <b>{pdfLabel(t.label)}</b>
              </button>
            ))}
          </div>

          <h2 className="home-h2">Recent Files</h2>
          <div className="list">
            {recent.length === 0 && <p className="viewer-status">No documents yet — tap the scan button below to start.</p>}
            {recent.map((d) => <FileRow key={d.id} d={d} onOpen={() => onOpenDoc(d)} />)}
          </div>
        </>
      )}
    </section>
  );
}
