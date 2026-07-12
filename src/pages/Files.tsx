import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { DocItem } from '../types';
import Header from '../components/Header';
import FileRow from '../components/FileRow';

type FilterTab = 'All' | 'Scanned' | 'PDFs' | 'Favorites' | 'Secure';

export default function FilesPage({ docs, onOpen, onDelete, onToggleFavorite, onToggleSecure, unlockedSecure, onImportPdf }: {
  docs: DocItem[];
  onOpen: (d: DocItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleSecure: (id: string) => void;
  unlockedSecure: boolean;
  onImportPdf: (file: File) => Promise<DocItem>;
}) {
  const [tab, setTab] = useState<FilterTab>('All');
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const visible = docs.filter((d) => !d.trashed);
  const filtered = visible.filter((d) => {
    if (tab === 'Scanned') return d.kind === 'scan';
    if (tab === 'PDFs') return d.kind === 'pdf';
    if (tab === 'Favorites') return d.favorite;
    if (tab === 'Secure') return d.secure;
    return !d.secure;
  });

  return (
    <section>
      <Header title="Files" sub={`${visible.length} documents`} />
      <button className="wide" disabled={importing} onClick={() => importRef.current?.click()}>
        <Upload size={16} /> {importing ? 'Importing…' : 'Import a PDF from this device'}
      </button>
      <input
        ref={importRef}
        hidden
        type="file"
        accept="application/pdf"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setImporting(true);
          try {
            await onImportPdf(file);
          } finally {
            setImporting(false);
          }
        }}
      />
      <div className="tabs">
        {(['All', 'Scanned', 'PDFs', 'Favorites', 'Secure'] as FilterTab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Secure' && !unlockedSecure && <p className="viewer-status">Enter your PIN in Profile → Secure Folder to view these.</p>}
      <div className="list">
        {filtered.length === 0 && <p className="viewer-status">No documents here yet.</p>}
        {(tab === 'Secure' && !unlockedSecure ? [] : filtered).map((d) => (
          <FileRow
            key={d.id}
            d={d}
            onOpen={() => onOpen(d)}
            onDelete={() => onDelete(d.id)}
            onToggleFavorite={() => onToggleFavorite(d.id)}
            onToggleSecure={() => onToggleSecure(d.id)}
          />
        ))}
      </div>
    </section>
  );
}
