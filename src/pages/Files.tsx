import { useRef, useState } from 'react';
import { CheckSquare, Download, Lock, Share2, Trash2, Upload, X } from 'lucide-react';
import type { DocItem } from '../types';
import Header from '../components/Header';
import FileRow from '../components/FileRow';
import { useT } from '../i18n';
import { sharePdf, saveFileToDevice } from '../capacitor/share';
import { makeZip } from '../export/zip';
import { toast } from '../toast';
import { sanitizeFilename } from '../utils';

type FilterTab = 'All' | 'Scanned' | 'PDFs' | 'Favorites' | 'Secure';
const FILTER_KEY: Record<FilterTab, string> = {
  All: 'files.all', Scanned: 'files.scanned', PDFs: 'files.pdfs', Favorites: 'files.favorites', Secure: 'files.secure',
};

export default function FilesPage({ docs, onOpen, onDelete, onBulkDelete, onToggleFavorite, onToggleSecure, onRename, onEdit, unlockedSecure, onImportPdf }: {
  docs: DocItem[];
  onOpen: (d: DocItem) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onToggleFavorite: (id: string) => void;
  onToggleSecure: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onEdit: (d: DocItem) => void;
  unlockedSecure: boolean;
  onImportPdf: (file: File) => Promise<DocItem>;
}) {
  const t = useT();
  const [tab, setTab] = useState<FilterTab>('All');
  const [importing, setImporting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const visible = docs.filter((d) => !d.trashed);
  const filtered = visible.filter((d) => {
    if (tab === 'Scanned') return d.kind === 'scan';
    if (tab === 'PDFs') return d.kind === 'pdf';
    if (tab === 'Favorites') return d.favorite;
    if (tab === 'Secure') return d.secure;
    return !d.secure;
  });
  const shown = tab === 'Secure' && !unlockedSecure ? [] : filtered;
  const selectedDocs = shown.filter((d) => selected.has(d.id));

  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exitSelect() { setSelectMode(false); setSelected(new Set()); }

  async function bulkDownload() {
    setWorking(true);
    let ok = 0;
    for (const d of selectedDocs) { try { await saveFileToDevice(d.blob, d.name); ok++; } catch { /* skip */ } }
    setWorking(false);
    toast(`Saved ${ok} file${ok === 1 ? '' : 's'}`);
    exitSelect();
  }
  async function bulkShare() {
    setWorking(true);
    try {
      if (selectedDocs.length === 1) {
        await sharePdf(selectedDocs[0].blob, selectedDocs[0].name);
      } else {
        const entries = await Promise.all(selectedDocs.map(async (d) => ({
          name: sanitizeFilename(d.name.endsWith('.pdf') ? d.name : `${d.name}.pdf`),
          data: new Uint8Array(await d.blob.arrayBuffer()),
        })));
        await sharePdf(makeZip(entries), `KukPDF-${selectedDocs.length}-files.zip`);
      }
    } catch { /* share cancel is silent in sharePdf */ }
    setWorking(false);
    exitSelect();
  }
  function bulkSecure() {
    selectedDocs.forEach((d) => { if (!d.secure) onToggleSecure(d.id); });
    toast(`Moved ${selectedDocs.length} to Secure Folder`);
    exitSelect();
  }
  function bulkDelete() {
    onBulkDelete(selectedDocs.map((d) => d.id));
    exitSelect();
  }

  return (
    <section>
      <div className="files-head">
        <Header title={t('files.title')} sub={t('files.docsCount', { n: visible.length })} />
        {shown.length > 0 && (
          selectMode
            ? <button className="files-select-btn" onClick={exitSelect}><X size={16} /> Cancel</button>
            : <button className="files-select-btn" onClick={() => setSelectMode(true)}><CheckSquare size={16} /> Select</button>
        )}
      </div>

      {!selectMode && (
        <button className="primary wide" disabled={importing} onClick={() => importRef.current?.click()}>
          <Upload size={16} /> {importing ? t('files.importing') : t('files.importPdf')}
        </button>
      )}
      <input ref={importRef} hidden type="file" accept="application/pdf"
        onChange={async (e) => {
          const file = e.target.files?.[0]; e.target.value = '';
          if (!file) return;
          setImporting(true);
          try { await onImportPdf(file); } finally { setImporting(false); }
        }} />

      <div className="tabs">
        {(['All', 'Scanned', 'PDFs', 'Favorites', 'Secure'] as FilterTab[]).map((ft) => (
          <button key={ft} className={tab === ft ? 'active' : ''} onClick={() => setTab(ft)}>{t(FILTER_KEY[ft])}</button>
        ))}
      </div>
      {tab === 'Secure' && !unlockedSecure && <p className="viewer-status">{t('files.secureHint')}</p>}
      <div className="list" style={selectMode && selected.size > 0 ? { paddingBottom: 76 } : undefined}>
        {shown.length === 0 && <p className="viewer-status">{t('files.emptyHere')}</p>}
        {shown.map((d) => (
          <FileRow
            key={d.id}
            d={d}
            onOpen={() => onOpen(d)}
            onDelete={() => onDelete(d.id)}
            onToggleFavorite={() => onToggleFavorite(d.id)}
            onToggleSecure={() => onToggleSecure(d.id)}
            onRename={(name) => onRename(d.id, name)}
            onEdit={() => onEdit(d)}
            selectMode={selectMode}
            selected={selected.has(d.id)}
            onSelectToggle={() => toggle(d.id)}
          />
        ))}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size}</span>
          <button disabled={working} onClick={bulkDownload}><Download size={18} /><span>{t('common.download')}</span></button>
          <button disabled={working} onClick={bulkShare}><Share2 size={18} /><span>{t('common.share')}</span></button>
          <button disabled={working} onClick={bulkSecure}><Lock size={18} /><span>Secure</span></button>
          <button disabled={working} className="danger" onClick={bulkDelete}><Trash2 size={18} /><span>{t('common.delete')}</span></button>
        </div>
      )}
    </section>
  );
}
