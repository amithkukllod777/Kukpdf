# KukPDF — Feature Inventory

Roles: KukPDF is single-role (one end user). No admin/role hierarchy in the app. Auth uses the shared **Kuklabs Account**; cloud data is scoped server-side to the user's `openId`.

Legend — Implementation: ✅ Working · ⚠️ Partial · 🚧 Not built (honest message) · Test: SMOKE (opened, no crash — this audit) / NONE (no automated test). Docs: TODO.md + CLAUDE.md.

| Module | Feature | Status | Test | Risk |
|---|---|---|---|---|
| Capture | Native document scanner (ML Kit, auto edge/crop) | ✅ (CI/native only) | NONE (needs device) | Med — unverified on device this audit |
| Capture | Scanner-first launch (auto-open on cold start) | ✅ native-only | SMOKE (web guard) | Low |
| Capture | Plain camera fallback | ✅ | NONE | Low |
| Capture | Import photos from gallery | ✅ | SMOKE | Low |
| Create | Image → PDF / JPG → PDF (real picker) | ✅ | SMOKE | Low |
| Create | Import a PDF from device | ✅ | SMOKE | Low |
| Scan edit | Crop / rotate / filter baked into export | ✅ | NONE | Med |
| Scan edit | Export pages → PDF (2200px cap vs OOM) | ✅ | NONE | Med |
| Organize | Merge / Split / Rotate / Delete Pages / Reorder Pages | ✅ | SMOKE | Low |
| Optimize | Compress PDF (image re-encode) | ✅ | SMOKE | Med (lossy) |
| Optimize | Repair PDF (best-effort re-save) | ✅ | SMOKE | Low |
| Edit | Sign PDF (draw + place signature) | ✅ | SMOKE | Low |
| Edit | Watermark / Page Numbers | ✅ | SMOKE | Low |
| Edit | Annotate (freehand) | 🚧 not built | SMOKE (shows message) | Low |
| OCR/AI | Image → Text (Eng + Hindi, offline tesseract) | ✅ | SMOKE | Med |
| OCR/AI | Searchable PDF (invisible OCR layer) | ✅ | SMOKE | Med |
| OCR/AI | Summarize PDF / Ask PDF | 🚧 not built (needs LLM backend) | SMOKE (message) | Low |
| Security | Password Protect (real AES-128, pdf-lib-plus-encrypt) | ✅ | SMOKE | Med |
| Security | Unlock PDF (remove password) | ✅ client-side (pdfjs decrypt + rebuild; pages rasterized) | FUNCTIONAL (protect→unlock→opens-free verified) | Med |
| Security | App PIN lock + re-lock on background | ✅ | NONE | Med |
| Security | Secure Folder (PIN-gated view) | ⚠️ UI-gating only, **not** encryption | NONE | Med |
| Files | List / search / filter (All/Scanned/PDFs/Favorites) | ✅ | SMOKE | Low |
| Files | Favorite / Delete / Share (OS share sheet) | ✅ | SMOKE | Low |
| Viewer | In-app PDF viewer (pdfjs) | ✅ | NONE | Med |
| Account | Email + password login | ✅ live (shared backend) | NONE (needs creds) | Med |
| Account | Email/login OTP + resend | ✅ live | NONE | Med |
| Account | Signup + email OTP verify | ✅ live | NONE | Med |
| Account | Forgot / reset password | ✅ live | NONE | Med |
| Account | Continue with Google (browser + deep link) | ✅ live (verified state deployed) | NONE (needs device) | Med |
| Account | Profile: identity card, Pro, Security, About, Sign out | ✅ | SMOKE | Low |
| Sync | Cloud sync (two-way, tombstone deletes) | ⚠️ built; backend live (401 verified); **not round-tripped on device this audit** | NONE | High |
| Legal | In-app Privacy Policy / Terms | ⚠️ in-app only; **no hosted URL verified** | SMOKE | Med (Play requires hosted URL) |
| Release | Signed AAB CI workflow | ✅ green (PKCS12 fix) | CI | Low |

**Duplicated / dead-end (found & fixed this audit):** Home "Edit PDF" → mapped to unbuilt "Annotate" (dead-end) → now opens Tools hub. **Undocumented:** none material. **Deprecated:** none.
