# KukPDF — Executive Summary (QA / Security / Production-Readiness Audit)

- **App:** KukPDF — Android PDF scanner + tools (React 19 · TypeScript · Vite 8 · Capacitor 8). Package `com.kuklabs.pdf`, version 0.1.0 (Build 1).
- **Audit date:** 2026-07-14 · **Auditor:** automated code inspection + executed Playwright smoke test (390×844, Chromium). Real-device, load, and production-DB tests were **NOT executed** (no device/APK-install harness or prod DB access in this environment) — those items are marked NOT TESTED throughout.
- **Environment audited:** source at `main` (commit `d26375e`), web build + dev server. Native/Gradle build verified only in CI.

## Overall health

**Functionally solid, honestly scoped, pre-1.0.** The core value (scan → PDF → tools → share/store, optional cloud sync, one shared Kuklabs account) works. Unbuilt features are clearly labelled "not built yet" rather than faked. No blocker/critical defects were found in code inspection or smoke testing.

## Issues by severity (confirmed)

| Severity | Count | Examples |
|---|---|---|
| Blocker | 0 | — |
| Critical | 0 | — |
| Major | 0 (open) | (BUG-001 Edit-PDF dead-end — **fixed this audit**) |
| Minor | 4 | Token stored unencrypted in Preferences; no crash reporting; Secure Folder is UI-gating not encryption; version string hardcoded (not from build) |
| Cosmetic | 2 | Files filter chips clip on very narrow screens; dark-mode of colourful Home not fully tuned |

## Top risks (by area)

1. **No automated test suite committed** (only this audit's smoke script) → regressions ship silently. *(added a smoke test this audit)*
2. **No crash/error reporting or analytics** → production failures are invisible.
3. **Session token in `@capacitor/preferences`** (Android SharedPreferences, not encrypted at rest) → token readable on a rooted device.
4. **Cloud sync not yet exercised end-to-end on a device** (backend deployed & endpoint verified returning 401; a full logged-in round-trip was NOT tested here).
5. **Store-readiness gaps**: Play Data-safety form, screenshots, and a hosted (not just in-app) Privacy Policy URL are required by Google Play and not verified present.

## Release decision

**CONDITIONAL GO** for an **Internal / Closed testing** track now (signed AAB builds green; core flows work; no critical bugs).

**NO-GO for public Production** until the "Immediate / before release" items in `REMEDIATION_PLAN.md` are closed — primarily: (a) hosted Privacy Policy + Play Data-safety declaration, (b) crash reporting, (c) a device pass of Google login + cloud-sync round-trip, (d) encrypt-at-rest for the session token, (e) a minimal committed automated-test gate.

See `PRODUCTION_READINESS_CHECKLIST.md` for the pass/fail matrix and `REMEDIATION_PLAN.md` for sequencing.
