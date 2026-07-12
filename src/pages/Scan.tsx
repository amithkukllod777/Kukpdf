import { useEffect, useState } from 'react';
import { Camera, Crop, FileText, ImagePlus, RotateCw, ScanLine, Trash2 } from 'lucide-react';
import type { FilterKind, PageItem, ScanMode } from '../types';
import Header from '../components/Header';
import CropEditor from '../components/CropEditor';
import { filterCss, filters, modes } from '../utils';
import { captureFromCamera } from '../capacitor/camera';
import { installNativeScannerModule, isNativeScannerAvailable, scanWithNativeScanner } from '../capacitor/documentScanner';
import { Capacitor } from '@capacitor/core';

export default function ScanPage({
  pages, mode, setMode, activeFilter, setActiveFilter, fileRef, importImages,
  addPages, exportPdf, rotatePage, deletePage, setCrop, exporting, exportError,
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
  exportError: string | null;
}) {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [cropping, setCropping] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState<boolean | null>(null); // null = still checking
  const [installing, setInstalling] = useState<number | null>(null); // install progress %, null = not installing
  const [scanning, setScanning] = useState(false);
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

  return (
    <section>
      <Header title="Scan" sub="Document · ID Card · Book · Receipt · QR" />
      <div className="camera">
        <div className="frame">
          {scannerReady ? <ScanLine size={56} /> : <Camera size={56} />}
          <p>
            {scanning ? 'Opening scanner…'
              : installing !== null ? `Enabling auto-scan… ${installing}%`
              : pages.length ? `${pages.length} page${pages.length > 1 ? 's' : ''} scanned`
              : scannerReady ? 'Ready to scan'
              : 'Ready to capture'}
          </p>
          <small>
            {scannerReady
              ? 'Tap the scan button below to open Google’s scanner — a full-screen camera with live edge detection, auto-crop, filters and multi-page, fully native. It is not shown inline here.'
              : isAndroid && scannerReady === false
                ? 'Auto-scan needs a small one-time Google Play services download — or use the plain camera below right away.'
                : 'Tap the scan button below to open your phone’s camera. Crop manually after capture.'}
          </small>
          {isAndroid && scannerReady === false && installing === null && (
            <span className="chip active" onClick={enableAutoScan} style={{ marginTop: 10 }}>Enable auto-scan</span>
          )}
        </div>
      </div>
      <div className="chips">
        {modes.map((m) => (
          <button key={m} className={mode === m ? 'chip active' : 'chip'} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      <div className="capture">
        <button onClick={() => fileRef.current?.click()}><ImagePlus />Import</button>
        <button className="shutter" onClick={shutter} disabled={scanning || installing !== null}>
          {scannerReady ? <ScanLine /> : <Camera />}
        </button>
        <button onClick={exportPdf} disabled={!pages.length || exporting}><FileText />{exporting ? '…' : 'PDF'}</button>
      </div>
      {exportError && <p className="viewer-status error">{exportError}</p>}
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
