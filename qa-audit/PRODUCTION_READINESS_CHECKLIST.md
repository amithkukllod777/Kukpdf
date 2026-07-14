# KukPDF — Production-Readiness Checklist

PASS / FAIL / NOT VERIFIED per requirement. Date 2026-07-14, commit `main`.

| # | Requirement | Status | Note |
|---|---|---|---|
| 1 | No blocker/critical bugs | **PASS** | None found in code review + smoke test |
| 2 | App builds (web + signed AAB) | **PASS** | `vite build` green; signed AAB green after PKCS12 fix |
| 3 | Core user journey works (scan→PDF→save/share) | **PARTIAL** | Web/UI verified; native scanner NOT device-tested here |
| 4 | Authentication works | **PARTIAL** | Backend live (401 verified); live login NOT tested here |
| 5 | Cloud sync works | **NOT VERIFIED** | Endpoint live; round-trip NOT tested on device |
| 6 | Production env vars correct (AWS) | **NOT VERIFIED** | Owner-side; `pdf.kuklabs.com` responds |
| 7 | Test credentials removed | **PASS** | No test creds in app |
| 8 | Debug mode disabled in release | **NOT VERIFIED** | Confirm release build strips sourcemaps/console |
| 9 | Secrets secured | **PASS** | No secrets in repo; keystore/pw in GH Secrets |
| 10 | Session token stored securely | **FAIL** | SEC-01: Preferences not encrypted at rest |
| 11 | Crash reporting / monitoring | **FAIL** | None integrated |
| 12 | Analytics / funnels | **FAIL** | None integrated |
| 13 | Legal pages available | **PARTIAL** | In-app Privacy/Terms exist; **hosted URL for Play NOT verified** |
| 14 | Play Data-safety form | **NOT VERIFIED** | Required; must declare data collected (email, docs-on-device, sync) |
| 15 | Account deletion / data export | **FAIL** | Not in-app; Play/GDPR expect it |
| 16 | App version correct | **PARTIAL** | Shows 0.1.0 (Build 1); string hardcoded, not from build config |
| 17 | DB migrations safe | **PASS** | `kukpdf_documents` additive; `CREATE TABLE IF NOT EXISTS` + idempotent .cjs; also auto-creates |
| 18 | Rollback plan | **NOT VERIFIED** | Define app + backend rollback (revert commit / redeploy) |
| 19 | Backup & restore tested | **NOT VERIFIED** | Sync is not a backup; S3 + DB backup/restore untested for KukPDF data |
| 20 | Support contact | **NOT VERIFIED** | No in-app support/contact link |
| 21 | Store metadata (icon, screenshots, desc) | **NOT VERIFIED** | Icon ready; screenshots/description NOT prepared |
| 22 | Release notes | **NOT VERIFIED** | Prepare for first release |
| 23 | `allowMixedContent:false` | **PASS** | Set in capacitor.config.ts |
| 24 | `android:allowBackup` = false | **NOT VERIFIED** | Verify so token isn't in adb backups |
| 25 | Signed with correct cert (SHA in Firebase) | **PASS** | Keystore SHA matches Firebase registration |

**Verdict:** **CONDITIONAL GO** for Internal/Closed testing; **NO-GO** for public Production until #10, #11, #13, #14, #15 (and ideally #5 device-verified) are closed.
