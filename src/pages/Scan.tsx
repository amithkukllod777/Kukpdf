import { useEffect, useRef, useState } from 'react';
import { Camera, Crop, FileText, ImagePlus, Plus, RotateCw, ScanLine, Trash2 } from 'lucide-react';
import type { FilterKind, PageItem, ScanMode } from '../types';
import Header from '../components/Header';
import CropEditor from '../components/CropEditor';
import { filterCss, filters, modes } from '../utils';
import { captureFromCamera } from '../capacitor/camera';
import { installNativeScannerModule, isNativeScannerAvailable, scanWithNativeScanner } from '../capacitor/documentScanner';
import { Capacitor } from '@capacitor/core';

export default function ScanPage({
  pages, mode, setMode, activeFilter, setActiveFilter,
  addPages, exportPdf, rotatePage, deletePage, setCrop, exporting, exportError,
  onImportPhotos, onImportPdf,
}: {
  pages: PageItem[];
  mode: ScanMode;
  setMode: (m: ScanMode) => void;
  activeFilter: FilterKind;
  setActiveFilter: (f: FilterKind) => void;
  addPages: (dataUrls: string[]) => void;
  exportPdf: () => void;
  rotatePage: (id: string) => void;
  deletePage: (id: string) => void;
  setCrop: (id: string, crop: PageItem['crop']) => void;
  exporting: boolean;
  exportError: string | null;
  onImportPhotos: () => void;
  onImportPdf: (file: File) => Promise<void>;
}) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState<boolean | null>(null); // null = still checking
  const [installing, setInstalling] = useState<number | null>(null); // install progress %, null = not installing
  const [scanning, setScanning] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const selected = pages.find((p) => p.id === selectedPage);
  const croppingPage = pages.find((p) => p.id === cropping);
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    isNativeScannerAvailable().then(setScannerReady);
  }, []);

  async function enableAutoScan() {
    setInstalling(0);
    try {
      await installNativeScannerModule(setInstalling);
      setScannerReady(await isNativeScannerAvailable());
    } finally {
      setInstalling(null);
    }
  }

  async function shutter() {
    if (scannerReady) {
      setScanning(true);
      try {
        const images = await scanWithNativeScanner();
        if (images?.length) addPages(images);
      } finally {
        setScanning(false);
      }
      return;
    }
    const dataUrl = await captureFromCamera();
    if (dataUrl) addPages([dataUrl]);
  }

  const busy = scanning || installing !== null;

  return (
    <section>
      <Header title="Scan" sub="Document · ID Card · Book · Receipt · QR" />
      <div className="chips">
        {modes.map((m) => (
          <button key={m} className={mode === m ? 'chip active' : 'chip'} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>

      {pages.length === 0 ? (
        <>
          <div className="scan-hero">
            <b>Ready when you are ✨</b>
            <span>
              {scannerReady
                ? "Google's live scanner — edge detect, auto-crop, multi-page"
                : isAndroid && scannerReady === false
                  ? 'Auto-scan needs a small one-time download — or use the plain camera now'
                  : 'Opens your camera — crop manually after capture'}
            </span>
            <button className="scan-cta" onClick={shutter} disabled={busy}>
              {scanning ? 'Opening scanner…'
                : installing !== null ? `Enabling auto-scan… ${installing}%`
                : <>{scannerReady ? <ScanLine /> : <Camera />}Scan a document</>}
            </button>
          </div>
          {isAndroid && scannerReady === false && installing === null && (
            <div className="chips" style={{ paddingBottom: 0 }}>
              <button className="chip active" onClick={enableAutoScan}>Enable auto-scan</button>
            </div>
          )}
          <div className="scan-secondary">
            <button onClick={onImportPhotos}><ImagePlus />Import photos</button>
            <button onClick={() => pdfInputRef.current?.click()}><FileText />Import PDF</button>
          </div>
        </>
      ) : (
        <>
          <div className="scan-status-mini">
            <span className="dot" />
            <b>{pages.length} page{pages.length > 1 ? 's' : ''} scanned</b>
            <span>· keep going or save</span>
          </div>
          <div className="pages">
            {pages.map((p, i) => (
              <button key={p.id} onClick={() => setSelectedPage(p.id)}>
                <img src={p.dataUrl} style={{ filter: filterCss(p.filter), transform: `rotate(${p.rotation}deg)` }} />
                <span>{i + 1}</span>
              </button>
            ))}
            <button className="add-page" onClick={shutter} disabled={busy}><Plus /></button>
          </div>
          <h2>Filter</h2>
          <div className="chips" style={{ paddingTop: 0 }}>
            {filters.map((f) => (
              <button key={f} className={activeFilter === f ? 'chip active' : 'chip'} onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="export-row">
            <button onClick={shutter} disabled={busy}>
              {scannerReady ? <ScanLine /> : <Camera />}{scanning ? 'Opening…' : 'Scan more'}
            </button>
            <button onClick={exportPdf} disabled={exporting}>
              <FileText />{exporting ? 'Saving…' : 'Save as PDF'}
            </button>
          </div>
        </>
      )}
      {exportError && <p className="viewer-status error">{exportError}</p>}

      <input
        ref={pdfInputRef}
        hidden
        type="file"
        accept="application/pdf"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) await onImportPdf(file);
        }}
      />

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
