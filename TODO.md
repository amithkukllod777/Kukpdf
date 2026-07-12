# KukPDF — Master Product Roadmap & TODO

> Status legend: `[x]` implemented, `[~]` partial/prototype, `[ ]` pending, `[!]` requires production validation.

## Session update — client-only V1 pass

This session took the app from a UI-only shell to a genuinely working, fully
client-side (no backend) PDF app. Real, working now: local persistent storage
(IndexedDB, replacing the in-memory demo list), an in-app PDF viewer, real
merge/split/rotate/delete/reorder/duplicate/insert-blank page tools, watermark,
page numbers, best-effort repair, image-based compress, draw-and-stamp
signatures, fully **offline** English + Hindi OCR (engine + language data
vendored in-app, no CDN dependency) with an OCR-backed searchable-PDF export,
native Android camera/gallery capture via the Capacitor Camera plugin, PIN
lock + a PIN-gated Secure Folder tab, Share via the OS share sheet, draft
Privacy Policy/Terms screens, and a real generated app icon (adaptive +
legacy, all densities) wired into the CI APK build. A `Build Signed Android
Release` workflow was added but needs a keystore added to GitHub Secrets by
you before it can run — see `android-ci/README.md`.

A later pass in the same session also fixed two real bugs found on a physical
device (Share silently failing because generated filenames contained "/"
from a locale date, and the Files list overflowing off-screen on narrow
phones), replaced the placeholder icon with the real KukPDF logo, and added
native auto-scan via Google's ML Kit Document Scanner (`@capacitor-mlkit/document-scanner`)
— real live-camera edge detection/auto-crop/perspective correction, the same
engine Google Drive uses, with an automatic fallback to plain camera capture
when it's unavailable. That scanner integration is wired end-to-end and
CI-built but **not yet verified on a physical device** — the native scanner
UI itself can only be exercised on-device.

A later pass brought KukPDF onto the **Kuklabs Universal Standard**
(`KUKLABS_IDENTITY.md` v1.0.0): adopted the shared design tokens (neutral
`#F8FAFC` foundation, single product accent `#2563EB` = accent-600 WCAG-AA,
semantic colours reserved for status, Inter type scale, dark-mode tokens) —
replacing the earlier warm-cream + multi-colour "playful" theme, which violated
the standard. Built the compliant **Kuklabs login screen** (`src/pages/Login.tsx`,
mirrors the KukKeep reference: Welcome to / Kuk**PDF**, Login/Sign Up tabs,
identity + password, Forgot Password, Continue with Google, Terms/Privacy,
Powered by Kuklabs) wired to the shared **AuthKit `auth.*` tRPC contract**
(`src/kuklabs/authClient.ts`) — email/password + email-OTP is a real working
path using the bearer token the backend returns for native apps, stored via
`@capacitor/preferences`. **No KukPDF-specific users table, password logic,
session system or Google client** — exactly per the mandate. Restructured
Profile to §16 (identity card, Security, About with `Version X.Y.Z (Build N)`,
Sign out, Powered by Kuklabs). Central brand config in `src/brand.ts` (§4).

**Still blocked on owner infra (not code):** "Continue with Google" needs the
Android OAuth client + SHA fingerprints registered in the shared Google Cloud
project; a `pdf.kuklabs.com` subdomain enables shared-cookie SSO on web. The
`AUTH_BASE` constant points at the shared backend (`www.kuklabs.com`) and swaps
to `auth.kuklabs.com` once that host is live. Cloud document sync (tying files
to the Kuklabs userId) is a future backend task — today documents remain
on-device in IndexedDB.

A later pass added real PDF password protection (`pdf-lib-plus-encrypt`, AES-128,
verified end-to-end: encrypting then re-opening with pdfjs-dist confirms the
file is unreadable without the password and correctly opens with it), wired
the Home screen's search box to actually filter tools and files by name (it
was decorative before), and fixed a dead-end bug where tapping "Secure
Folder" from the Tools grid opened the generic document-picker tool runner
(which has no handler for it and would hang on "Working…" forever) instead of
jumping to the real Secure Folder UI in Profile.

A later pass fixed a batch of real bugs reported from a physical device: (1)
**root-caused the Scan page's "PDF button does nothing" flow break** — full
6000×4000-ish camera/scanner photos were being baked at native resolution
into canvases and held as base64 for every page with no size cap, which is a
well-known WebView OOM-crash trigger on Android; fixed by capping every baked
page and every captured photo to 2200px on the long edge (verified: a
4032×3024 test photo now bakes down to 2200×1649), and by wrapping export in
a try/catch so any future failure shows a visible error instead of silently
doing nothing; (2) **Image to PDF and JPG to PDF were completely non-functional**
— they opened the same PDF-only document picker as every other tool, with no
way to actually select images; replaced with a real multi-image file picker
that builds a PDF directly; (3) **added a real "Import a PDF file" entry
point**, both on the Files page and inside every tool's document picker, so
external PDFs from the phone's file manager can enter the app at all — before
this, every tool could only operate on PDFs the app itself had created; (4)
fixed duplicate tool icons (Merge PDF/Reorder Pages and Watermark/Secure
Folder were using the same icon); (5) removed a redundant second "open
camera" button on the Scan page (the big frame panel and the shutter button
both triggered the scanner) — the frame is now a status panel, the shutter is
the one scan control; (6) simplified the Profile page (removed 3 redundant
Company/Website/Developer cards that duplicated the brand card above them,
added an app version row, added an honest "not logged in yet" account row
instead of no login affordance at all); (7) shrunk the adaptive icon's fill
another ~20% so the K mark reads more clearly, re-verified against the
circular-mask simulation. Since a password-protected PDF can't be opened by
plain pdf-lib/pdfjs, protected docs are now tagged and excluded from every
other tool's picker with a visible note, and the in-app viewer shows a clear
message instead of crashing when one is opened directly.

**Still explicitly not built** (flagged rather than faked): Unlock PDF —
no client-side/browser-safe library was found that can reliably *decrypt*
an already password-protected PDF (the encryption library used above only
adds passwords, it doesn't remove them; the one real decrypt candidate,
`qpdf-wasm`, is a single-maintainer, single-release alpha package judged too
risky to ship). Would need a proper server-side tool like qpdf. Also still
not built: PDF annotation/freehand drawing, AI summarize/ask-PDF, cloud
sync/login/accounts, subscriptions/payments, an admin dashboard, and any
backend — all of Phases 9 (cloud parts)–13 below are unstarted. Files'
Tags/folders are still UI-only. Full per-item status below is updated to
match.

## Product identity

- [x] Product name: KukPDF
- [x] Tagline: Smart PDF Scanner & Tools
- [x] Company: Kuklabs Inc.
- [x] Website identity: kuklabs.com
- [x] Android package ID: `com.kuklabs.pdf`
- [x] Kuklabs K brand mark added
- [x] Kuklabs blue-purple visual theme
- [x] “A Kuklabs Product” branding
- [x] KukPDF app icon generated (K mark on brand navy) and wired into all Android adaptive + legacy mipmap densities via CI
- [ ] Final splash screen using approved KukPDF icon (Android 12+ system default splash now derives from the new icon + background color; no custom splash screen built)
- [ ] About page with version, company, website, support, privacy and terms (Privacy/Terms exist from Profile; no dedicated About/version screen)
- [~] Final Play Store assets: 512×512 icon ready (`resources/playstore-icon-512.png`); feature graphic and screenshots still needed

## Current technology and build status

- [x] React + TypeScript frontend
- [x] Vite build system
- [x] Responsive mobile-first UI
- [x] Capacitor Android wrapper
- [x] Android Gradle project generated during CI
- [x] GitHub Actions debug APK build
- [x] APK artifact download workflow
- [x] PWA manifest
- [x] Vercel SPA rewrite
- [x] Direct `/scan` route
- [~] Target URL prepared: `https://pdf.kuklabs.com/scan`; DNS/Vercel domain verification pending
- [x] pdf-lib client-side PDF creation/editing (replaced jsPDF)
- [x] Lucide icons
- [x] Production signed AAB workflow (`build-android-release.yml`) — needs your keystore in GitHub Secrets before it can run, see `android-ci/README.md`
- [ ] Android signing keystore in GitHub Secrets (you must generate + add this)
- [ ] Release versioning and changelog
- [ ] Crash reporting and analytics

## Current MVP screens

- [x] Home dashboard
- [x] Search UI
- [x] Quick tools cards
- [x] Recent files UI
- [x] Tools screen and grouped tool catalogue
- [x] Scan screen prototype
- [x] Files screen prototype
- [x] Profile/settings screen
- [x] Bottom navigation: Home, Tools, Scan, Files, Profile
- [x] Desktop sidebar layout
- [x] Image import
- [x] Multi-page page tray
- [x] Basic page preview
- [x] Rotate page
- [x] Delete page
- [x] Basic visual filters
- [x] Image-to-PDF export (rotation/crop/filter baked into the output, not just previewed)
- [x] Download generated PDF
- [x] In-app PDF viewer (renders pages to canvas; no more forced hand-off to an external PDF app)
- [x] Local document list persists in IndexedDB (survives reload; no longer in-memory demo data)
- [x] Most tool pages now run real client-side processing (merge/split/rotate/delete/reorder/duplicate/insert-blank/watermark/page-numbers/compress/repair/sign/OCR/searchable-PDF/password-protect); Annotate, Unlock PDF, Summarize PDF and Ask PDF remain UI-only placeholders with an honest "not built yet" message instead of a fake success

# Phase 1 — Production Native Scanner

## Camera scanner

- [x] Native document scanner — Google ML Kit Document Scanner (`@capacitor-mlkit/document-scanner`), the same scanner Google Drive uses: live camera preview, auto edge-detection, auto-crop, perspective correction and filters, all native, no custom Kotlin/CameraX module written by hand. Android only; auto-falls back to plain camera capture on web/iOS or if the on-device Google Play services module isn't installed yet (with an in-app "Enable auto-scan" one-time download prompt). **Not yet verified on a physical device** — built and wired end-to-end, CI-built, but the native scanner UI itself can only be exercised on-device, not in this dev sandbox.
- [x] CameraX live camera preview (via the ML Kit scanner's built-in native UI, not a hand-built preview)
- [x] Camera permission flow (handled natively by the scanner / Capacitor Camera plugin)
- [x] Auto document detection
- [x] Real-time edge/boundary detection
- [x] Auto capture when document is stable (part of ML Kit's FULL scanner mode)
- [x] Manual capture (native Android camera intent via `@capacitor/camera`, used as the fallback path)
- [ ] Batch/continuous scanning beyond the scanner's own multi-page flow
- [x] Multi-page scanning (native multi-page capture within one scan session, up to 20 pages)
- [x] Perspective correction (native, via ML Kit)
- [x] Automatic page straightening (native, via ML Kit)
- [ ] Automatic orientation detection (outside the ML Kit flow)
- [x] Manual rotation (90° steps, still available for touch-ups after scanning)
- [ ] Flash: Auto / On / Off (controlled by the native scanner UI itself, not exposed as an app setting)
- [ ] Camera grid
- [ ] Focus and exposure controls
- [ ] Blur warning
- [ ] Low-light warning
- [ ] Glare warning
- [x] Gallery import (native multi-picker via Capacitor Camera, with plain file-input fallback; ML Kit scanner also supports gallery import when `galleryImportAllowed` is on)
- [x] Import existing PDF for editing (real "Import a PDF file" entry point, on the Files page and inside every tool's document picker)
- [ ] Scan quality presets: Low / Medium / High / Original (pages are now auto-capped to 2200px on the long edge to prevent OOM crashes, but this isn't a user-facing quality selector)

## Recommended native stack

- [ ] Kotlin (not needed for the scanner — solved via a plugin instead, see below)
- [ ] Jetpack CameraX (superseded by ML Kit's own scanner UI)
- [x] Google ML Kit Document Scanner (via `@capacitor-mlkit/document-scanner`, not hand-written Kotlin)
- [ ] OpenCV for custom image processing
- [x] ML Kit Text Recognition (via tesseract.js instead — see OCR section; different engine, same category of capability)
- [x] Tesseract optional offline OCR (this is what's actually used — fully offline, not "optional")
- [ ] Room database (IndexedDB used instead — see File Manager section)
- [ ] WorkManager background jobs
- [ ] Jetpack Security / encrypted storage
- [x] Capacitor native bridge (this is the chosen approach — a Capacitor plugin for the scanner rather than migrating to native Compose)
- [x] Decided: Capacitor hybrid, using native plugins (Camera, ML Kit Document Scanner, Share, Filesystem, Preferences) for the pieces that genuinely need native code

## Scan modes

- [~] Mode selector UI exists
- [ ] Document
- [ ] ID Card
- [ ] Book
- [ ] Receipt / Bill
- [ ] Invoice
- [ ] Business Card
- [ ] Passport
- [ ] Certificate
- [ ] Notes
- [ ] Question Paper
- [ ] Whiteboard
- [ ] Photo
- [ ] QR scanner

## Scan enhancement

- [x] CSS preview filters: Original, Auto, B&W, Gray, Color, Contrast — and now actually baked into the exported/edited PDF (canvas filter + rotation + crop), not just a UI preview
- [ ] Auto Enhance
- [ ] Clean Scan
- [ ] Magic Color
- [ ] Enhanced Color
- [ ] Black & White
- [ ] Grayscale
- [ ] Light
- [ ] Dark
- [ ] High Contrast
- [ ] Text Mode
- [ ] Photo Mode
- [ ] Custom Filter
- [ ] Brightness
- [ ] Contrast
- [ ] Saturation
- [ ] Exposure
- [ ] Sharpness
- [ ] Highlights
- [ ] Shadows
- [ ] Temperature
- [ ] White balance
- [ ] Background cleanup
- [ ] Shadow removal
- [ ] Glare removal
- [ ] Stain removal
- [ ] Wrinkle cleanup
- [ ] Dark-edge removal
- [ ] Noise reduction
- [ ] Blur correction
- [ ] Low-light enhancement

## Crop and page editing

- [ ] Smart crop
- [~] Crop (draggable rectangle with resize handles; not a true 4-corner perspective warp)
- [ ] Edge adjustment magnifier
- [ ] Perspective crop
- [x] Rotate left/right (real, baked into output)
- [ ] Flip horizontal/vertical
- [ ] Straighten
- [ ] Resize
- [ ] Change page ratio
- [ ] Change page size
- [x] Add page (blank page insert, from the page organizer)
- [ ] Rescan page
- [ ] Replace page
- [x] Duplicate page
- [x] Delete page (real — removes the page from the actual PDF)
- [x] Rotate page (real — persisted PDF page rotation, not just a UI prototype)
- [~] Reorder pages (move-left/move-right buttons in the page organizer; not drag-and-drop)
- [x] Multi-select pages (checkbox multi-select for delete, in the page organizer)
- [ ] Apply filter to all pages
- [ ] Undo/redo
- [ ] Preserve original image separately

# Phase 2 — PDF Creation and Organization

## PDF creation

- [x] Multiple-images-to-PDF export (real, filters/rotation/crop baked in)
- [ ] Native Scan to PDF (camera capture → PDF works; no native Kotlin scanner behind it)
- [x] Camera to PDF
- [x] Image to PDF (fixed: previously opened the PDF-only document picker with no way to select an image, so it was non-functional as shipped; now opens a real multi-image picker)
- [x] JPG to PDF (same fix, restricted to `image/jpeg` in the file picker)
- [x] PNG to PDF (covered by the same image picker, `image/*` accepted)
- [x] Searchable PDF (OCR word boxes placed as an invisible, selectable text layer over the scanned image)
- [ ] Add scans to existing PDF
- [x] Merge scanned documents (via Merge PDF tool)
- [ ] Page size: Auto / Original / A3 / A4 / A5 / Letter / Legal (fixed to A4 for scan export)
- [ ] Portrait / Landscape (auto only, not user-selectable)
- [ ] Page margins
- [ ] Page alignment
- [ ] Output quality: Low / Medium / High / Original (compress tool has 3 levels; scan export itself is fixed quality)
- [ ] PDF metadata: title, author, subject, keywords

## Organize PDF

- [x] Tool catalogue UI, now wired to real processing
- [x] Merge PDF
- [x] Split PDF (splits into one file per page)
- [~] Extract pages (underlying function exists; not exposed as its own tool button — use the page organizer + Split)
- [x] Delete pages
- [x] Reorder pages (move-left/right, not drag-and-drop)
- [x] Rotate pages
- [x] Duplicate pages
- [x] Insert blank page
- [ ] Insert scanned page
- [ ] Insert image
- [x] Combine documents (Merge PDF)
- [ ] Remove blank pages automatically

## Optimize and repair

- [x] Compress PDF (rasterizes pages to smaller JPEGs — real size reduction, best for scanned/photo PDFs; not suited to text PDFs since it flattens text to an image)
- [x] Compression levels: Low / Recommended / High
- [x] Reduce image resolution (part of Compress)
- [x] Optimize scanned PDF (Compress)
- [ ] Convert color pages to grayscale (as a standalone toggle — the B&W/Gray scan filters exist but aren't a dedicated PDF-level tool)
- [ ] Target file-size option
- [~] Repair damaged PDF (best-effort: lenient re-parse + re-save via pdf-lib; not a guaranteed recovery tool)
- [ ] Linearize PDF for fast web view

# Phase 3 — OCR and Searchable Documents

- [x] Image to Text
- [x] Scan to Text
- [x] PDF to Text (OCR runs page-by-page over a PDF's rendered pages)
- [ ] OCR selected area (whole page only)
- [ ] Editable extracted text (shown read-only + copy, not editable in place)
- [x] Copy text
- [ ] Search text (no dedicated search UI over OCR'd text, though Searchable PDF output is searchable in any PDF viewer)
- [ ] Share text (only whole-PDF share, not extracted text)
- [ ] Text-to-speech
- [ ] Translate extracted text
- [x] English OCR
- [x] Hindi OCR
- [x] Multilingual OCR (English + Hindi combined; only these two languages are bundled)
- [ ] Automatic language detection (user picks the language)
- [ ] Handwriting recognition
- [ ] Table recognition
- [x] Searchable PDF creation
- [ ] OCR export to TXT
- [ ] OCR export to DOCX
- [ ] OCR export to XLSX
- [ ] OCR confidence display
- [x] Offline OCR mode (engine + English/Hindi language data vendored in-app — works with zero network from first launch)
- [ ] Batch OCR (one document at a time)

# Phase 4 — ID, KYC and Book Scanner

## ID and KYC

- [ ] Aadhaar scanner
- [ ] PAN scanner
- [ ] Driving Licence scanner
- [ ] Voter ID scanner
- [ ] Passport scanner
- [ ] Front-and-back scan
- [ ] Combine both sides on one A4 page
- [ ] Automatic card detection and crop
- [ ] Aadhaar-number masking
- [ ] “For KYC Only” watermark
- [ ] Custom purpose watermark
- [ ] Date watermark
- [ ] Recipient/company watermark
- [ ] KYC export templates

## Book scanner

- [ ] Scan two facing pages together
- [ ] Automatically split left/right pages
- [ ] Curved-page correction
- [ ] Book-page flattening
- [ ] Remove center/gutter shadow
- [ ] Remove fingers
- [ ] Correct page distortion
- [ ] Continuous page scanning
- [ ] Automatic page ordering
- [ ] Page-number detection

# Phase 5 — PDF Editing, Annotation and Signature

## Editor

- [ ] Add text
- [ ] Edit existing PDF text where supported
- [ ] Freehand drawing
- [ ] Pen
- [ ] Marker
- [ ] Highlight
- [ ] Underline
- [ ] Strike-through
- [ ] Eraser
- [ ] Shapes
- [ ] Add image
- [ ] Add comments
- [ ] Add notes
- [ ] Add hyperlinks
- [ ] Header/footer
- [ ] Page numbers
- [ ] Watermark
- [ ] Stamp
- [ ] Date
- [ ] Checkmark

## Signature

- [x] Draw signature (canvas pad, stamped onto the PDF via pdf-lib)
- [ ] Type signature
- [ ] Upload signature image
- [ ] Scan physical signature
- [x] Save multiple signatures (persisted in IndexedDB, reusable across documents)
- [ ] Add initials
- [ ] Add date
- [ ] Resize/move signature (fixed placement — bottom-right of the last page)
- [x] Reuse saved signature
- [ ] Signature audit trail for advanced e-sign

# Phase 6 — Conversion Tools

- [ ] PDF to JPG
- [ ] PDF to PNG
- [ ] PDF to Image
- [ ] PDF to Word
- [ ] Word to PDF
- [ ] PDF to Excel
- [ ] Excel to PDF
- [ ] PDF to PowerPoint
- [ ] PowerPoint to PDF
- [ ] PDF to Text
- [ ] Text to PDF
- [ ] HTML to PDF
- [ ] PDF/A conversion
- [ ] LibreOffice headless conversion service

# Phase 7 — File Manager and Offline Storage

- [x] Files UI backed by real, persistent documents (no more sample/demo data)
- [x] Persistent document database — IndexedDB (via `idb-keyval`), not Room/SQLite, but equivalent in effect: survives reload, fully offline
- [x] Local storage (documents stored as real Blobs in IndexedDB)
- [x] All Documents
- [x] Recent (Home shows the 3 most recent)
- [x] Scanned
- [x] PDFs
- [ ] Images (no separate image-only view)
- [x] Favorites
- [ ] Shared
- [ ] Downloads
- [x] Secure Folder (PIN-gated tab; a lock button on each file moves it in/out of the Secure Folder)
- [ ] Trash (delete is immediate/permanent, no trash-and-restore)
- [ ] Create folders
- [ ] Rename
- [ ] Move
- [ ] Copy
- [x] Duplicate (pages; not whole documents)
- [x] Delete
- [ ] Restore
- [x] Search by filename (Home's search box filters both tools and files by name in real time)
- [ ] Full-text OCR search
- [ ] Tags
- [ ] Sort by name/date/size/type (fixed newest-first)
- [ ] Grid/list view (list only)
- [x] Document preview (in-app PDF viewer)
- [ ] Document details
- [ ] Storage usage dashboard
- [x] Offline-first operation (genuinely true now — storage, PDF tools and OCR all run without a network connection)

# Phase 8 — Security and Privacy

- [x] Password-protect PDF (real AES-128 encryption via `pdf-lib-plus-encrypt`; verified the output PDF rejects opening without the password and opens correctly with it)
- [ ] Remove PDF password where authorized (no viable client-side decrypt library found; would need a server-side tool like qpdf — honest "not built yet" message shown in-app)
- [x] PDF encryption (Password Protect tool, AES-128)
- [x] Lock document (PIN-gated Secure Folder, per document)
- [x] App PIN (SHA-256-hashed, checked via `@capacitor/preferences`; re-locks on app background/resume)
- [ ] Fingerprint unlock
- [ ] Face/biometric unlock
- [x] Secure/private folder
- [x] Hide documents (moved out of the main Files list into the Secure Folder)
- [ ] Block screenshots in secure mode
- [x] Local/private processing mode (everything — storage, PDF tools, OCR — now runs entirely on-device; there is no backend to send data to)
- [ ] HTTPS only (n/a — no network calls in this build)
- [ ] Signed cloud URLs
- [ ] Encrypt sensitive local data (PIN gates access in-app but IndexedDB itself is unencrypted at rest)
- [ ] Delete temporary files after processing
- [ ] Privacy controls and consent
- [ ] “Do not train AI on user documents” policy
- [x] Privacy Policy (draft, in-app; needs Kuklabs legal review + a hosted public URL before Play Store submission)
- [x] Terms of Service (same caveat)
- [x] Data deletion workflow (delete a document removes it from IndexedDB immediately)
- [ ] Account deletion workflow (n/a — no accounts exist)

# Phase 9 — Cloud, Account and Sharing

- [ ] Email/phone/social login (Profile now shows an honest "Not logged in — will use one shared Kuklabs account across all Kuklabs apps · Coming soon" row instead of no login affordance at all; still no working auth, no backend to authenticate against)
- [ ] Guest/offline mode
- [ ] Kuk Cloud
- [ ] Google Drive
- [ ] OneDrive
- [ ] Dropbox
- [ ] Automatic backup
- [ ] Manual backup
- [ ] Multi-device sync
- [ ] Restore documents
- [x] Offline access (the whole app works offline — no cloud/sync backing it yet)
- [ ] Wi-Fi-only backup
- [ ] Conflict resolution
- [x] Share PDF (native OS share sheet via `@capacitor/share`, Web Share API fallback in the browser)
- [ ] Share JPG/PNG
- [ ] Share Word/TXT
- [x] WhatsApp share (via the generic OS share sheet, not a dedicated WhatsApp button)
- [x] Email share (same — generic share sheet)
- [ ] Print
- [x] Save to device (download)
- [ ] Save to cloud
- [ ] Generate secure share link
- [ ] QR sharing
- [ ] Link expiry
- [ ] Password-protected share links

# Phase 10 — AI Tools

- [ ] AI Scan Cleanup
- [ ] AI Shadow Remover
- [ ] AI Glare Remover
- [ ] AI Blur Fix
- [ ] AI Document Enhancer
- [ ] AI Background Cleaner
- [ ] AI object remover
- [ ] Finger remover
- [ ] Stain remover
- [ ] Book-page flattening
- [ ] Restore old documents
- [ ] Improve handwriting visibility
- [ ] Automatic document naming
- [ ] PDF summarization
- [ ] Ask PDF / document chat
- [ ] Translate complete document
- [ ] Extract key information
- [ ] Invoice data extraction
- [ ] Receipt data extraction
- [ ] Table extraction
- [ ] Form extraction
- [ ] Multi-document chat
- [ ] Citations to page numbers in AI answers
- [ ] pgvector or Qdrant embeddings
- [ ] AI usage limits and cost controls

# Phase 11 — Backend and Infrastructure

## Proposed stack

- [ ] Decide Node.js/NestJS vs FastAPI
- [ ] PostgreSQL
- [ ] S3-compatible storage: AWS S3 / Cloudflare R2
- [ ] Redis
- [ ] BullMQ or Celery background jobs
- [ ] Docker services
- [ ] PDF processing service
- [ ] OCR service
- [ ] AI service
- [ ] Authentication service
- [ ] Subscription service
- [ ] Admin dashboard

## PDF processing engines to evaluate

- [ ] Apache PDFBox
- [ ] qpdf
- [ ] Ghostscript
- [ ] ImageMagick
- [ ] LibreOffice headless
- [ ] Stirling PDF as isolated service/reference only after license review
- [ ] PDF.js viewer

## Database tables

- [ ] users
- [ ] documents
- [ ] document_pages
- [ ] folders
- [ ] scan_jobs
- [ ] ocr_jobs
- [ ] pdf_jobs
- [ ] ai_jobs
- [ ] subscriptions
- [ ] usage_logs
- [ ] shared_links
- [ ] devices
- [ ] audit_logs
- [ ] support_tickets

## Storage layout

- [ ] `/user_id/documents/`
- [ ] `/user_id/scans/`
- [ ] `/user_id/exports/`
- [ ] `/user_id/ocr/`
- [ ] `/user_id/temp/`
- [ ] Store originals and processed files separately
- [ ] Never overwrite originals
- [ ] Lifecycle rules for temporary files

# Phase 12 — Subscription and Monetization

- [ ] Free plan limits
- [ ] KukPDF Pro monthly plan
- [ ] KukPDF Pro yearly plan
- [ ] Scan limits
- [ ] OCR limits
- [ ] AI-credit limits
- [ ] Cloud storage limits
- [ ] Free watermark decision
- [ ] Razorpay for India
- [ ] Stripe for global billing
- [ ] Google Play Billing for Android
- [ ] Restore purchases
- [ ] Subscription entitlement sync
- [ ] Coupons/referrals
- [ ] Usage meter
- [ ] Upgrade/paywall screens

# Phase 13 — Admin, Quality and Operations

- [ ] Admin dashboard
- [ ] User management
- [ ] Subscription management
- [ ] Usage/cost analytics
- [ ] Failed job monitoring
- [ ] Storage monitoring
- [ ] Abuse/rate limiting
- [ ] Support tickets
- [ ] Feature flags
- [ ] Remote configuration
- [ ] Audit logs
- [ ] Automated backups
- [ ] Disaster recovery plan

## Testing

- [ ] Unit tests
- [ ] Component tests
- [ ] Android instrumentation tests
- [ ] Scanner tests across low/mid/high-end phones
- [ ] Camera permission tests
- [ ] Large PDF stress tests
- [ ] 100+ page document tests
- [ ] OCR accuracy tests: English/Hindi/mixed
- [ ] Offline tests
- [ ] Low-memory tests
- [ ] Storage-full tests
- [ ] Security review
- [ ] Dependency vulnerability scanning
- [ ] Accessibility testing
- [ ] Performance benchmarks

# Phase 14 — Deployment and Release

- [x] GitHub repository
- [x] GitHub Actions debug APK (now with the real KukPDF icon applied)
- [ ] Vercel deployment connected to repository
- [ ] `pdf.kuklabs.com` DNS connected and verified
- [ ] Production backend environment
- [ ] Dev/staging/production environments
- [~] Signed Android AAB — workflow exists (`build-android-release.yml`); needs your keystore in GitHub Secrets to actually produce a signed build, see `android-ci/README.md`
- [ ] Play Console app setup (requires your Google Play Developer account)
- [ ] Data Safety form
- [ ] Privacy Policy URL (draft text exists in-app; needs hosting at a public URL, e.g. on kuklabs.com)
- [ ] Terms URL (same)
- [ ] Support email
- [ ] Closed testing release
- [ ] Internal testing group
- [ ] Crash-free beta target
- [ ] Production rollout
- [ ] Phased rollout and rollback plan

# Open-source repository audit

Do not blindly merge repositories. Audit every dependency before reuse.

- [ ] OSS Document Scanner: license, architecture, reusable scanner concepts
- [ ] Stirling PDF: AGPL/commercial implications; prefer isolated service or clean implementation after legal review
- [ ] Google ML Kit Document Scanner sample: SDK terms and integration
- [ ] Tesseract OCR: license and language packs
- [ ] MakeACopy: license, OpenCV/ONNX concepts
- [ ] OpenCV license
- [ ] Record attribution requirements
- [ ] Create `THIRD_PARTY_NOTICES.md`
- [ ] Create software bill of materials (SBOM)

# Immediate next sprint — priority order

1. [ ] Replace hybrid upload placeholder with native CameraX + ML Kit Document Scanner.
2. [ ] Add real auto edge detection, crop and perspective correction.
3. [ ] Save scans persistently using Room + Android local storage.
4. [ ] Add real multi-page PDF export with filters applied to output.
5. [ ] Add OCR English + Hindi and searchable PDF.
6. [ ] Add merge, split, compress, rotate and page organizer.
7. [ ] Add final KukPDF icon to Android adaptive icons and splash screen.
8. [ ] Add signed AAB GitHub Actions workflow.
9. [ ] Connect and verify `pdf.kuklabs.com/scan` deployment.
10. [ ] Complete privacy policy, terms and Play Store closed testing.

## Definition of production-ready V1

KukPDF V1 is not complete until users can reliably: scan with native camera, auto-detect/crop pages, enhance scans, create and organize multi-page PDFs, run English/Hindi OCR, search documents, sign/watermark/compress PDFs, save files offline, protect private documents, and install a signed Play Store build with privacy and crash monitoring.
