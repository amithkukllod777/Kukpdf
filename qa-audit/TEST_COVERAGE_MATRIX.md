# KukPDF — Test Coverage Matrix

Executed 2026-07-14 via `tests/smoke.mjs` (Playwright, Chromium, 390×844) against `npm run dev`. **27/27 checks PASS, 0 console errors, 0 crashes.** Native-only paths (scanner, share, PIN) and live-account paths were NOT executed here.

Legend: ✅ executed-pass · ⛔ not executed · N/A.

| Feature | Smoke | Functional | Negative | Boundary | API | Security | Regression | UI/UX | Automated | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| App boot / 4 tabs | ✅ | ⛔ | N/A | N/A | N/A | N/A | ✅ | ✅ | smoke.mjs | PASS |
| Home Quick Tools (8) | ✅ open | ⛔ | ⛔ | ⛔ | N/A | N/A | ✅ | ✅ | smoke.mjs | PASS |
| Tools (21) open | ✅ | ⛔ | ⛔ | ⛔ | N/A | N/A | ✅ | ✅ | smoke.mjs | PASS |
| Merge/Split/Rotate/Reorder/Delete | ✅ open | ⛔ run | ⛔ | ⛔ | N/A | N/A | ⛔ | ✅ | — | PARTIAL |
| Compress/Repair | ✅ open | ⛔ | ⛔ | ⛔ | N/A | N/A | ⛔ | ✅ | — | PARTIAL |
| Sign/Watermark/Page Numbers | ✅ open | ⛔ | ⛔ | N/A | N/A | N/A | ⛔ | ✅ | — | PARTIAL |
| OCR / Searchable PDF | ✅ open | ⛔ | ⛔ | ⛔ (large img) | N/A | N/A | ⛔ | ✅ | — | PARTIAL |
| Password Protect | ✅ open | ⛔ | ⛔ | N/A | N/A | ⛔ (AES verify) | ⛔ | ✅ | — | PARTIAL |
| Unsupported tools (Annotate/Summarize/Ask/Unlock) | ✅ honest msg | N/A | N/A | N/A | N/A | N/A | ✅ | ✅ | smoke.mjs | PASS |
| Files list/search/filter | ✅ | ⛔ | ⛔ | ⛔ | N/A | N/A | ✅ | ✅ | — | PARTIAL |
| Login opens + **fits one screen** | ✅ (0px overflow) | ⛔ | ⛔ | N/A | ⛔ | ⛔ | ✅ | ✅ | smoke.mjs | PASS |
| Auth: login/OTP/signup/reset | ⛔ | ⛔ | ⛔ | N/A | ⛔ live | ⛔ | ⛔ | ✅ | — | NOT TESTED |
| Google login (deep link) | ⛔ device | ⛔ | N/A | N/A | ⛔ | ⛔ | ⛔ | ✅ | — | NOT TESTED |
| Cloud sync round-trip | ⛔ | ⛔ | ⛔ | ⛔ (60MB) | ⛔ (401 verified only) | ⛔ IDOR (code-reviewed PASS) | ⛔ | ✅ | — | NOT TESTED |
| Native scanner / camera / share / PIN | ⛔ device | ⛔ | N/A | N/A | N/A | N/A | ⛔ | ⛔ | — | NOT TESTED |

**Coverage gaps (highest risk first):** cloud-sync round-trip, live auth flows, per-tool functional/negative/boundary runs, native scanner/share/PIN, security verification of AES + token storage. See `MISSING_TESTS.md`.
