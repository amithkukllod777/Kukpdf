# KukPDF — Master Product Roadmap & TODO

> Status legend: `[x]` implemented, `[~]` partial/prototype, `[ ]` pending, `[!]` requires production validation.

## Product identity

- [x] Product name: KukPDF
- [x] Tagline: Smart PDF Scanner & Tools
- [x] Company: Kuklabs Inc.
- [x] Website identity: kuklabs.com
- [x] Android package ID: `com.kuklabs.kukpdf`
- [x] Kuklabs K brand mark added
- [x] Kuklabs blue-purple visual theme
- [x] “A Kuklabs Product” branding
- [~] Final KukPDF app icon generated; export approved source as production PNG/SVG and add all Android adaptive-icon sizes
- [ ] Final splash screen using approved KukPDF icon
- [ ] About page with version, company, website, support, privacy and terms
- [ ] Final Play Store assets: icon, feature graphic, screenshots and listing

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
- [x] jsPDF client-side image-to-PDF
- [x] Lucide icons
- [ ] Production signed AAB workflow
- [ ] Android signing keystore in GitHub Secrets
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
- [x] Image-to-PDF export
- [x] Download generated PDF
- [~] Local document list currently in memory/demo state
- [~] Tool pages are mostly UI placeholders; processing engines pending

# Phase 1 — Production Native Scanner

## Camera scanner

- [ ] Native Kotlin scanner module
- [ ] CameraX live camera preview
- [ ] Camera permission flow
- [ ] Auto document detection
- [ ] Real-time edge/boundary detection
- [ ] Auto capture when document is stable
- [ ] Manual capture
- [ ] Batch/continuous scanning
- [ ] Multi-page native scanning
- [ ] Perspective correction
- [ ] Automatic page straightening
- [ ] Automatic orientation detection
- [ ] Auto rotation
- [ ] Flash: Auto / On / Off
- [ ] Camera grid
- [ ] Focus and exposure controls
- [ ] Blur warning
- [ ] Low-light warning
- [ ] Glare warning
- [ ] Gallery import
- [ ] Import existing PDF for editing
- [ ] Scan quality presets: Low / Medium / High / Original

## Recommended native stack

- [ ] Kotlin
- [ ] Jetpack CameraX
- [ ] Google ML Kit Document Scanner
- [ ] OpenCV for custom image processing
- [ ] ML Kit Text Recognition
- [ ] Tesseract optional offline OCR
- [ ] Room database
- [ ] WorkManager background jobs
- [ ] Jetpack Security / encrypted storage
- [ ] Capacitor native bridge during transition, or migrate scanner screens fully to native Compose
- [ ] Decide final UI strategy: Capacitor hybrid vs Kotlin Jetpack Compose

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

- [~] CSS preview filters: Original, Auto, B&W, Gray, Color, Contrast
- [ ] Real image processing baked into exported pages
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
- [ ] Manual four-corner crop
- [ ] Edge adjustment magnifier
- [ ] Perspective crop
- [ ] Rotate left/right
- [ ] Flip horizontal/vertical
- [ ] Straighten
- [ ] Resize
- [ ] Change page ratio
- [ ] Change page size
- [ ] Add page
- [ ] Rescan page
- [ ] Replace page
- [ ] Duplicate page
- [x] Delete page prototype
- [x] Rotate page prototype
- [ ] Drag-and-drop page reorder
- [ ] Multi-select pages
- [ ] Apply filter to all pages
- [ ] Undo/redo
- [ ] Preserve original image separately

# Phase 2 — PDF Creation and Organization

## PDF creation

- [x] Basic multiple-images-to-PDF export
- [ ] Native Scan to PDF
- [ ] Camera to PDF
- [ ] Image to PDF
- [ ] JPG to PDF
- [ ] PNG to PDF
- [ ] Searchable PDF
- [ ] Add scans to existing PDF
- [ ] Merge scanned documents
- [ ] Page size: Auto / Original / A3 / A4 / A5 / Letter / Legal
- [ ] Portrait / Landscape
- [ ] Page margins
- [ ] Page alignment
- [ ] Output quality: Low / Medium / High / Original
- [ ] PDF metadata: title, author, subject, keywords

## Organize PDF

- [~] Tool catalogue UI exists
- [ ] Merge PDF
- [ ] Split PDF
- [ ] Extract pages
- [ ] Delete pages
- [ ] Reorder pages
- [ ] Rotate pages
- [ ] Duplicate pages
- [ ] Insert blank page
- [ ] Insert scanned page
- [ ] Insert image
- [ ] Combine documents
- [ ] Remove blank pages automatically

## Optimize and repair

- [ ] Compress PDF
- [ ] Compression levels: Low / Recommended / High
- [ ] Reduce image resolution
- [ ] Optimize scanned PDF
- [ ] Convert color pages to grayscale
- [ ] Target file-size option
- [ ] Repair damaged PDF
- [ ] Linearize PDF for fast web view

# Phase 3 — OCR and Searchable Documents

- [ ] Image to Text
- [ ] Scan to Text
- [ ] PDF to Text
- [ ] OCR selected area
- [ ] Editable extracted text
- [ ] Copy text
- [ ] Search text
- [ ] Share text
- [ ] Text-to-speech
- [ ] Translate extracted text
- [ ] English OCR
- [ ] Hindi OCR
- [ ] Multilingual OCR
- [ ] Automatic language detection
- [ ] Handwriting recognition
- [ ] Table recognition
- [ ] Searchable PDF creation
- [ ] OCR export to TXT
- [ ] OCR export to DOCX
- [ ] OCR export to XLSX
- [ ] OCR confidence display
- [ ] Offline OCR mode
- [ ] Batch OCR

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

- [ ] Draw signature
- [ ] Type signature
- [ ] Upload signature image
- [ ] Scan physical signature
- [ ] Save multiple signatures
- [ ] Add initials
- [ ] Add date
- [ ] Resize/move signature
- [ ] Reuse saved signature
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

- [~] Files UI and sample documents exist
- [ ] Room/SQLite persistent document database
- [ ] Local filesystem storage
- [ ] All Documents
- [ ] Recent
- [ ] Scanned
- [ ] PDFs
- [ ] Images
- [ ] Favorites
- [ ] Shared
- [ ] Downloads
- [ ] Secure Folder
- [ ] Trash
- [ ] Create folders
- [ ] Rename
- [ ] Move
- [ ] Copy
- [ ] Duplicate
- [ ] Delete
- [ ] Restore
- [ ] Search by filename
- [ ] Full-text OCR search
- [ ] Tags
- [ ] Sort by name/date/size/type
- [ ] Grid/list view
- [ ] Document preview
- [ ] Document details
- [ ] Storage usage dashboard
- [ ] Offline-first operation

# Phase 8 — Security and Privacy

- [ ] Password-protect PDF
- [ ] Remove PDF password where authorized
- [ ] PDF encryption
- [ ] Lock document
- [ ] App PIN
- [ ] Fingerprint unlock
- [ ] Face/biometric unlock
- [ ] Secure/private folder
- [ ] Hide documents
- [ ] Block screenshots in secure mode
- [ ] Local/private processing mode
- [ ] HTTPS only
- [ ] Signed cloud URLs
- [ ] Encrypt sensitive local data
- [ ] Delete temporary files after processing
- [ ] Privacy controls and consent
- [ ] “Do not train AI on user documents” policy
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Data deletion workflow
- [ ] Account deletion workflow

# Phase 9 — Cloud, Account and Sharing

- [ ] Email/phone/social login
- [ ] Guest/offline mode
- [ ] Kuk Cloud
- [ ] Google Drive
- [ ] OneDrive
- [ ] Dropbox
- [ ] Automatic backup
- [ ] Manual backup
- [ ] Multi-device sync
- [ ] Restore documents
- [ ] Offline access
- [ ] Wi-Fi-only backup
- [ ] Conflict resolution
- [ ] Share PDF
- [ ] Share JPG/PNG
- [ ] Share Word/TXT
- [ ] WhatsApp share
- [ ] Email share
- [ ] Print
- [ ] Save to device
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
- [x] GitHub Actions debug APK
- [ ] Vercel deployment connected to repository
- [ ] `pdf.kuklabs.com` DNS connected and verified
- [ ] Production backend environment
- [ ] Dev/staging/production environments
- [ ] Signed Android AAB
- [ ] Play Console app setup
- [ ] Data Safety form
- [ ] Privacy Policy URL
- [ ] Terms URL
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
