# KukPDF — Remediation Plan

Owner type: **APP** (kukpdf), **BE** (kukbook-erp backend), **OPS** (owner/infra). Complexity S/M/L/XL.

## Immediate — before public Production release
| Action | Pri | Owner | Cx | Depends | Verify |
|---|---|---|---|---|---|
| Hosted Privacy Policy + Terms URL (not just in-app) + link in app/store | P0 | OPS | S | — | URL loads; linked in Play listing |
| Play **Data-safety** declaration (email, on-device docs, optional sync to S3) | P0 | OPS | S | privacy URL | Play console form complete |
| **Account deletion + data export** in-app | P0 | APP+BE | M | sync API | User can delete account + download their data |
| **Crash reporting** (e.g. Sentry/Crashlytics) | P0 | APP | S | — | Test crash appears in dashboard |
| Encrypt session token at rest (Keystore-backed secure storage) | P1 | APP | M | plugin | Token not plaintext in shared_prefs |
| Device-verify **Google login** + **cloud-sync round-trip** (2 devices) | P0 | QA | S | deployed BE | Journeys pass on device |
| Confirm `android:allowBackup=false` + release strips console/sourcemaps | P1 | APP | S | — | Manifest + release bundle checked |
| Per-user **sync storage quota** (abuse guard) | P1 | BE | S | — | Upload rejected past quota |

## Short term — next sprint
| Action | Pri | Owner | Cx |
|---|---|---|---|
| P0 tests: sync engine unit + auth client + sync API contract (see MISSING_TESTS) | P1 | APP+BE | M |
| **Unlock / remove-password** tool (table-stakes) | P1 | APP(+BE if server decrypt) | M |
| OCR progress + cancel; success toasts; delete confirm/undo | P2 | APP | S |
| Version string from build config (not hardcoded) | P2 | APP | S |
| Store screenshots + description + release notes | P1 | OPS | S |
| App Links (verified https deep link) for pdf.kuklabs.com | P2 | APP+OPS | M |

## Medium term
| Action | Pri | Owner | Cx |
|---|---|---|---|
| Export scan/PDF → Word/Excel | P1 | BE/AI | L |
| Hindi app UI (i18n) | P2 | APP | M |
| Code-split pdfjs/pdf-lib/tesseract (bundle size) | P2 | APP | M |
| Sync preferences (off / Wi-Fi-only / always); compression quality; page size | P2 | APP | S–M |
| Secure Folder real at-rest encryption (or rename) | P2 | APP | M |

## Long term / tech debt
- AI summarize/ask (KukLabs AI Engine) · more Indian OCR scripts · analytics/funnels · backup-restore drill for KukPDF S3+DB data · low-end device perf pass · accessibility (labels, contrast, font-scaling, touch targets).

**Each item's verification is the "Verify"/success column above; do not mark done until verified on the stated environment.**
