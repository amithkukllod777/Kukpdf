import { useState } from 'react';
import { Camera, Crop, FileText, ImagePlus, RotateCw, Trash2 } from 'lucide-react';
import type { FilterKind, PageItem, ScanMode } from '../types';
import Header from '../components/Header';
import CropEditor from '../components/CropEditor';
import { filterCss, filters, modes } from '../utils';
import { captureFromCamera } from '../capacitor/camera';

export default function ScanPage({
  pages, mode, setMode, activeFilter, setActiveFilter, fileRef, importImages,
  addPages, exportPdf, rotatePage, deletePage, setCrop, exporting,
}: {
  pages: PageItem[];
  mode: ScanMode;
  setMode: (m: ScanMode) => void;
  activeFilter: FilterKind;
  setActiveFilter: (f: FilterKind) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  importImages: (files: FileList | null) => void;
  addPages: (dataUrls: string[]) => void;
  exportPdf: () => void;
  rotatePage: (id: string) => void;
  deletePage: (id: string) => void;
  setCrop: (id: string, crop: PageItem['crop']) => void;
  exporting: boolean;
}) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const selected = pages.find((p) => p.id === selectedPage);
  const croppingPage = pages.find((p) => p.id === cropping);

  async function shutter() {
    const dataUrl = await captureFromCamera();
    if (dataUrl) addPages([dataUrl]);
  }

  return (
    <section>
      <Header title="Scan" sub="Document · ID Card · Book · Receipt · QR" />
      <div className="camera">
        <div className="frame">
          <Camera size={56} />
          <p>Tap the shutter to use your camera</p>
          <small>Native camera capture via Capacitor. Auto edge-detection is not built yet — crop manually after capture.</small>
        </div>
      </div>
      <div className="chips">
        {modes.map((m) => (
          <button key={m} className={mode === m ? 'chip active' : 'chip'} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      <div className="capture">
        <button onClick={() => fileRef.current?.click()}><ImagePlus />Import</button>
        <button className="shutter" onClick={shutter}><Camera /></button>
        <button onClick={exportPdf} disabled={!pages.length || exporting}><FileText />{exporting ? '…' : 'PDF'}</button>
      </div>
      <div className="chips">
        {filters.map((f) => (
          <button key={f} className={activeFilter === f ? 'chip active' : 'chip'} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
      </div>
      <h2>Pages ({pages.length})</h2>
      <div className="pages">
        {pages.map((p, i) => (
          <button key={p.id} onClick={() => setSelectedPage(p.id)}>
            <img src={p.dataUrl} style={{ filter: filterCss(p.filter), transform: `rotate(${p.rotation}deg)` }} />
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="modal">
          <div className="sheet">
            <img src={selected.dataUrl} style={{ filter: filterCss(selected.filter), transform: `rotate(${selected.rotation}deg)` }} />
            <div className="actions">
              <button onClick={() => rotatePage(selected.id)}><RotateCw />Rotate</button>
              <button onClick={() => { setCropping(selected.id); setSelectedPage(null); }}><Crop />Crop</button>
              <button onClick={() => { deletePage(selected.id); setSelectedPage(null); }}><Trash2 />Delete</button>
              <button onClick={() => setSelectedPage(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      {croppingPage && (
        <CropEditor
          dataUrl={croppingPage.dataUrl}
          initial={croppingPage.crop}
          onCancel={() => setCropping(null)}
          onApply={(crop) => { setCrop(croppingPage.id, crop); setCropping(null); }}
        />
      )}
    </section>
  );
}
