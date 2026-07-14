# KukPDF — Performance Audit

**No on-device performance profiling was executed** (no device/APK-install harness or profiler in this environment). Below: web-build measurements (facts) + code-based assessments (clearly labelled ASSUMPTION). Re-measure on a low-end Android device before release.

| Metric | Observed / basis | Expected threshold | Status | Bottleneck | Recommendation |
|---|---|---|---|---|---|
| Web build time | ✅ ~0.6–7s (`vite build`) | — | PASS (fact) | — | — |
| JS bundle (main chunk) | ✅ ~1.30 MB / ~439 KB gzip (build output) | <500 KB gzip ideal | ⚠️ over (fact) | Single chunk; pdfjs+pdf-lib+tesseract | Code-split heavy libs via dynamic `import()` (OCR/pdfjs only when used) |
| Inter font | ✅ 48 KB woff2 (fact) | <100 KB | PASS | — | — |
| App cold start | ⛔ NOT MEASURED | <2.5s low-end | NOT TESTED | scanner-first auto-launch adds a native call | Measure; lazy-init non-critical modules |
| Scan → PDF export | ASSUMPTION: OK (2200px cap prevents WebView OOM) | no OOM | PARTIAL (code) | Full-res images | Cap present (`bake.ts MAX_DIM=2200`); verify on 2GB device |
| OCR run (tesseract WASM) | ⛔ NOT MEASURED | usable on mid device | NOT TESTED | WASM memory + CPU | Show progress + cancel; consider downscaling input |
| pdfjs render | ⛔ NOT MEASURED | smooth scroll | NOT TESTED | Large PDFs | Lazy-render pages; already `.slice()`-clones input |
| Memory leaks | ASSUMPTION low | none | PARTIAL (code) | listeners cleaned in `useEffect` returns | Verify with a long session on device |
| Unnecessary re-renders | ASSUMPTION low | — | PARTIAL | React state localized | Consider memoizing tool grids if needed |
| Network calls | Auth/sync only; on-device default | minimal | PASS (code) | — | Add Wi-Fi-only sync option |
| Battery / CPU | ⛔ NOT MEASURED | — | NOT TESTED | scanner/OCR | Profile on device |

**Top perf actions:** (1) code-split pdfjs/pdf-lib/tesseract so the initial bundle shrinks and heavy libs load on demand; (2) OCR progress+cancel; (3) measure cold-start + OCR + large-PDF render on a real low-end device.
