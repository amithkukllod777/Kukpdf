# KukPDF — Missing Tests (prioritized by risk)

Current committed tests: **1** — `tests/smoke.mjs` (added this audit; Playwright boot/nav/tool-open/login-fit). No unit/integration/API/security/perf suites exist.

## P0 — critical paths (add first)
1. **Cloud-sync engine unit tests** (`src/sync.ts`): upload local-only, download remote-only, remote-tombstone deletes local, local tombstone deletes remote, last-write-wins, concurrent-run guard. Mock `syncClient`. *(pure logic — easy, high value)*
2. **Sync API contract tests** (backend `kukpdfSync.ts`): 401 unauthenticated (each route), IDOR (user B cannot GET user A's `kd_id`), soft-delete tombstone in list, upload replaces + bumps `updatedAt`. *(needs a test DB or mocked `db`/`sdk`)*
3. **Auth client tests** (`identityDetection.ts`, `authMessages.ts`, `isStrongPassword`): email vs phone detection, E.164 normalization, friendly-error mapping never leaks raw text, password policy boundaries.

## P1 — functional per-tool
4. **PDF tool functional tests** on a real fixture PDF: Merge (2→1, page count), Split (N→N), Rotate (angle), Delete/Reorder (order), Compress (smaller size), Page Numbers/Watermark (content present), Password Protect (output actually encrypted — AES verify), and **malformed-input** negative cases (corrupt PDF → error surfaced, not swallowed). *(pdf-lib in Node)*
5. **OCR tests**: known image → expected text (Eng + Hindi), and a large image (memory boundary).

## P2 — UI/e2e + native
6. Extend `smoke.mjs` to **run** a tool end-to-end (seed a valid PDF, merge, assert a new Files entry) and to exercise search/filter/delete-with-tombstone.
7. **Native tests (device/emulator)**: scanner capture, share sheet, PIN lock + re-lock on background, Google deep-link return. *(manual procedures below until automated)*

## Manual procedures where automation isn't feasible now
- **Google login:** install APK → Profile → Sign in → Continue with Google → complete in browser → app reopens logged-in. Expected: returns to app, session persists after restart.
- **Cloud sync round-trip:** device A login → scan 2 PDFs → Sync now → device B same account login → PDFs download; delete on A → Sync → gone on B.
- **PIN lock:** set PIN → background/foreground → app locked → correct PIN unlocks, wrong PIN rejected.
- **Encryption at rest (security):** adb pull `shared_prefs` → confirm session token is NOT plaintext (currently WILL be — see SEC-01).
