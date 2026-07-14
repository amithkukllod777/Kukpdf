# KukPDF — Security Audit

Scope: client app (`amithkukllod777/Kukpdf`) + the KukPDF sync backend added to `amithkukllod777/kukbook-erp` (`server/kukpdfSync.ts`). Method: code inspection + endpoint probe. No destructive testing, no access to real user data. Mapped to OWASP Mobile Top 10 (2024) and API Top 10 where relevant. Date: 2026-07-14.

| ID | Finding | Severity | Component | Status |
|---|---|---|---|---|
| SEC-01 | Session token stored in `@capacitor/preferences` (Android SharedPreferences) — **not encrypted at rest** | Medium | `authClient.ts` | OPEN |
| SEC-02 | No rate-limit / lockout on client login attempts (server-side rate limit unverified) | Medium | Auth | PARTIAL |
| SEC-03 | "Secure Folder" is UI-gating, not encryption; docs remain plaintext in IndexedDB | Medium | Secure Folder | OPEN (by design; label honestly) |
| SEC-04 | Custom-scheme deep link `kukpdf://auth` can be claimed by another app | Low→Med | Deep link | MITIGATED |
| SEC-05 | Rendering untrusted PDFs via pdfjs (parser CVEs historically) | Low | Viewer | ACCEPTABLE (pdfjs 4.10.38, recent) |
| SEC-06 | No secrets in repo; keystore + passwords only in GitHub Secrets / out-of-band | — | Repo | PASS |
| SEC-07 | IDOR on sync API | — | `kukpdfSync.ts` | PASS (scoped to `openId`) |
| SEC-08 | Password policy | Low | Login | PARTIAL (client 8+letter+number; server authoritative) |

## Details

### SEC-01 — Insecure token storage (Medium)
`persistSession` writes the bearer JWT to `Preferences` (`kuklabs:session-token`). On Android this is SharedPreferences — world-readable only to the app, but **not encrypted**; on a rooted/backed-up device it is recoverable. **Attack scenario:** physical/rooted access → token exfiltration → session reuse until expiry. **Remediation:** store the token in Android Keystore-backed secure storage (e.g. `capacitor-secure-storage-plugin` / EncryptedSharedPreferences). **Verify:** confirm token not present in `/data/data/com.kuklabs.pdf/shared_prefs/*.xml` in plaintext. **Positive:** token is never placed in the deep-link URL (only a one-time code is) — good.

### SEC-02 — Brute-force / rate limit (Medium, PARTIAL)
Client shows a friendly generic error and never leaks which field was wrong (good — no user-enumeration via messages). The backend `/app-exchange` has an IP rate-limit (20/min, seen in `googleAuth.ts`); the `auth.*` tRPC login path's rate-limit was **not verified** in this audit. **Remediation/verify:** confirm server-side throttling + lockout on `directLogin`/`verifyOtp`.

### SEC-03 — Secure Folder is not encryption (Medium, honest)
The PIN gates UI visibility only; documents live unencrypted in IndexedDB regardless. This is acceptable **if labelled honestly** (it currently is not labelled as encryption). **Remediation:** either rename to "Hidden folder" or implement at-rest encryption (WebCrypto AES-GCM with a PIN-derived key).

### SEC-04 — Deep-link hijack (Low→Med, mitigated)
Android custom schemes are first-come; a malicious app could register `kukpdf://auth`. **Mitigation present:** the deep link carries only a **short-lived one-time code**, redeemed once over HTTPS at `/app-exchange` (server deletes it on use), and returns the token to the app's own HTTP stack — a hijacker gets a single already-spent code, not a token. **Hardening:** migrate to **Android App Links** (verified https deep links via `assetlinks.json`) for `pdf.kuklabs.com` so the OS binds the link to this app.

### SEC-05 — Untrusted PDF parsing (Low, acceptable)
pdfjs and pdf-lib parse user-supplied PDFs. Historic pdfjs CVEs (e.g. font/JS) are patched in recent lines; `pdfjs-dist@4.10.38` is current-enough. **Remediation:** keep pdfjs updated; ensure pdfjs `isEvalSupported:false` (default in v4) so embedded JS can't run.

### SEC-06 — Secrets hygiene (PASS)
`grep` over `src/` found no hardcoded API keys/passwords/tokens. Release keystore + store/key passwords live only in GitHub Secrets and the local scratchpad (never committed); Google client secret is an AWS env var. The keystore is a PKCS12 file — its key is protected by the store password (no separate key password); CI uses the store password for signing.

### SEC-07 — Sync API access control (PASS)
Every `/api/kukpdf/*` handler calls `sdk.authenticateRequest(req)` and scopes rows to the returned `openId` (`WHERE kd_userId = ?`) — a client can never address another user's `kd_id`. Unauthenticated requests return **401** (verified live: `pdf.kuklabs.com` and `www.kuklabs.com` returned `{"error":"Sign in to sync your documents."}`). Deletes are soft (tombstone). Upload uses `express.raw` scoped to the route (no JSON-body confusion). **Residual:** no per-user storage quota / upload-count limit → a user could fill S3 (abuse, not IDOR). Add a quota.

### SEC-08 — Password policy (Low, partial)
Client enforces 8+ chars with a letter and a number on signup/reset. The **server** is authoritative; confirm it enforces at least the same. No maximum-length DoS guard verified.

## Not tested (needs a device / live account)
Session-fixation, token-expiry behaviour, TLS pinning, WebView `allowMixedContent:false` (set in `capacitor.config.ts` — good), backup/`android:allowBackup` flag (verify it's `false` so token isn't in adb backups), and OWASP MASVS resilience checks.
