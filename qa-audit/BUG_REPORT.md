# KukPDF — Bug Report

Confirmed defects (with evidence) separated from suspected risks. Evidence = code line and/or executed smoke test on 2026-07-14.

---

## BUG-001 — "Edit PDF" Home card dead-ends on unbuilt Annotate  ·  FIXED this audit
- **Module:** Home / Quick Tools · **Env:** all
- **Repro:** Home → tap "Edit PDF".
- **Expected:** an editing action.
- **Actual (before fix):** opened `Annotate` → "Freehand annotation editing … not built yet." A prominent Home tool led to a dead end. **Evidence:** user device screenshot 2026-07-14; `Home.tsx` mapped `Edit PDF → onOpenTool('Annotate')`.
- **Severity:** Major · **Priority:** High · **Root cause:** Home card wired to an UNSUPPORTED tool.
- **Fix (applied):** `Edit PDF → setTab('tools')` (opens the real tools hub). **Regression risk:** none (navigation only).

## BUG-002 — Login screen scrolls / not fitted to one screen  ·  FIXED this audit
- **Module:** Auth · **Env:** Android device (user), reproduced at 390×844.
- **Repro:** Profile → Sign in.
- **Expected:** one-screen auth (per Auth Pack: "fits without visible scrolling").
- **Actual (before fix):** content overflowed → page scrolled. **Evidence:** user report 2026-07-14; measured `.auth` overflow > 0.
- **Severity:** Minor · **Priority:** High (UX) · **Root cause:** fixed 48px top padding + large inter-element margins exceeded viewport height.
- **Fix (applied):** vertical-centre flex + tightened non-control spacing; safe-area insets. **Evidence of fix:** smoke test measured overflow **0px** (scrollH 844 == clientH 844). **Regression risk:** low (spacing only; control sizes unchanged per Auth Pack).

## BUG-003 — App font never loaded (Inter declared, not bundled)  ·  FIXED this audit
- **Module:** Design system · **Env:** device.
- **Actual (before fix):** `font-family:Inter` set but no `@font-face`/font file existed → devices fell back to system font (Roboto); wordmark and UI looked off. **Evidence:** no `@font-face` / no font asset in repo before fix; user report "font mismatch".
- **Severity:** Minor (Cosmetic-major) · **Root cause:** typeface never vendored (Capacitor has no network for Google Fonts).
- **Fix (applied):** vendored `public/fonts/inter.woff2` + `@font-face`; verified `document.fonts.check('800 28px Inter') === true`.

## BUG-004 — Recent Files placeholder not PDF-like (blue lines)  ·  FIXED this audit
- **Severity:** Cosmetic · **Fix:** red "PDF" badge (`--pdf-red #C60000`, sampled from the logo). **Evidence:** screenshot.

## BUG-005 — Duplicate sign-in entries on Profile  ·  FIXED this audit
- **Module:** Profile · **Actual (before fix):** identity card "Sign in to Kuklabs" **and** Cloud-sync card "Sign in to sync" both shown when signed out. **Severity:** Minor (UX). **Fix:** Cloud-sync card renders only when signed in. **Evidence:** smoke test — signed-out Profile now shows 0 cloud-sync sections, 1 sign-in.

## BUG-006 — Header cramped under the status bar  ·  FIXED this audit
- **Severity:** Cosmetic · **Root cause:** `main` had no top safe-area padding. **Fix:** `padding-top: calc(28px + env(safe-area-inset-top))`. **Note:** no `@capacitor/status-bar` plugin installed — if edge-to-edge overlap persists on some devices, add the plugin and `setOverlaysWebView(false)` (see REMEDIATION).

---

## Suspected risks (NOT confirmed defects — need device/live testing)

- **RISK-A (High):** Cloud-sync round-trip not exercised end-to-end on a device this audit. Two-way merge, tombstone propagation, and large-file (60MB cap) upload need a real logged-in test on 2 devices. *(Backend endpoint verified returning 401 unauthenticated on pdf.kuklabs.com + www.kuklabs.com.)*
- **RISK-B (Med):** Google login not verified on a physical device this audit (deep-link return `kukpdf://auth`). Backend `state.app="kukpdf"` verified live.
- **RISK-C (Med):** Compress/Repair/Merge on large or malformed PDFs — no boundary testing performed. pdf-lib load can throw on corrupt input; ToolRunner should surface (not swallow) such errors.
- **RISK-D (Med):** OCR on large images / low-RAM devices — tesseract WASM is memory-heavy; not profiled on low-end hardware.
- **RISK-E (Low):** Files filter chips row may clip the last chip on very narrow screens (horizontal scroll present).
