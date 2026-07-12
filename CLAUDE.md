# CLAUDE.md — KukPDF

KukPDF — Scan, edit & secure PDFs. A Kuklabs product (React 19 + TypeScript +
Vite + Capacitor 8, Android). Package id: `com.kuklabs.pdf`.

## ⚠️ KUKLABS IDENTITY, UI, AUTH, PROFILE & RELEASE STANDARD (MANDATORY — read first)

This app follows the **`KUKLABS_IDENTITY.md`** universal standard (v1.0.0). Only
the product name, icon, tagline and **one accent colour** may differ from other
Kuklabs apps — auth, identity infra, typography, neutral/semantic colours, nav
sizing, profile structure and release policy are the shared standard and must
not be reinvented here. Central brand config lives in `src/brand.ts` (§4).

**Identity & infra (§2–§3):**
- **One Kuklabs Account.** KukPDF has no users table, password logic, session
  system or Google OAuth client of its own. Auth goes through the shared AuthKit
  `auth.*` tRPC contract via `src/kuklabs/authClient.ts` (directLogin /
  directRegister / verifyOtp / verifyLoginOtp / resendOtp / forgot / reset).
  Native uses the **bearer token** every `auth.*` mutation returns, stored in
  `@capacitor/preferences`, sent as `Authorization: Bearer`.
- **One shared server + MySQL DB, one Google Cloud + Firebase project.** Any
  future server data → shared DB, new prefixed userId-scoped tables. New Android
  app = a new App registration (`com.kuklabs.pdf` + SHA) in the existing project,
  never a new project/OAuth web client. Email is the account-identity key.

**Design system (§5–§7, §26):** Inter; neutral foundation `#F8FAFC` bg /
`#101828` ink / semantic colours reserved for status; **KukPDF accent =
`#2563EB`** (accent-600, WCAG-AA 5.17:1) with a 50–900 ramp in `styles.css`.
No gradients-as-decoration, no rainbow category colours, no `#000` text. Dark
mode tokens defined. Bottom nav = 5 items, labels always shown, Scan raised as
the primary FAB.

**Login (§15):** `src/pages/Login.tsx` mirrors the KukKeep reference exactly —
product icon, "Welcome to / Kuk**PDF**", tagline, Login/Sign Up tabs, identity +
password fields, Forgot Password, primary Login, Continue with Google, Terms/
Privacy, Powered by Kuklabs.

**Profile (§16):** `src/pages/Profile.tsx` — identity card (Kuklabs Account vs
Sign in), Pro, Security (app PIN/Secure Folder), About with
`Version X.Y.Z (Build N)` (`src/brand.ts`) + Powered by Kuklabs, Sign out.

**Honest status:** email/password + OTP login is a REAL working path against the
shared backend (bearer-token flow). Blocked on owner infra: "Continue with
Google" needs the Android OAuth client + SHA registered in the shared Google
Cloud project; a `pdf.kuklabs.com` subdomain gives shared-cookie SSO on web.
Documents still live on-device in IndexedDB until cloud sync ships. The
`AUTH_BASE` in `authClient.ts` points at the shared backend (`www.kuklabs.com`);
swap to `auth.kuklabs.com` when that host is live. **Never fake a login.**

## Repo map

- `src/App.tsx` — tabs, doc/signature state, PIN-lock gating, PDF import, auth
  state (`user` / login overlay); `src/pages/` — screens; `src/components/` —
  ToolRunner, DocPicker, FileRow, PdfViewer, PageManager, SignaturePad, CropEditor.
- `src/brand.ts` — central product brand + version. `src/kuklabs/authClient.ts`
  — AuthKit client (the ONLY auth pathway).
- `src/pdf/` — pdf-lib tools; export/bake pipeline (2200px cap prevents WebView
  OOM — do not remove); pdfjs render (`.slice()`-clones input; pdfjs detaches
  ArrayBuffers).
- `src/ocr.ts` + `public/vendor/` — tesseract.js fully vendored offline (Eng+Hin).
- `src/capacitor/` — camera, ML Kit Document Scanner, share, PIN lock.
- `.github/workflows/` — `build-android-apk.yml` (debug, auto on push);
  `build-android-release.yml` (signed AAB; needs keystore GitHub Secrets).

## Conventions

- Never fake a feature — unbuilt tools show an honest "not built yet" message
  (`ToolRunner.tsx` UNSUPPORTED map).
- Password-protected PDFs (`DocItem.passwordProtected`) are excluded from other
  tools' pickers — plain pdf-lib/pdfjs can't read them.
- Filenames pass `sanitizeFilename()` — Android `Filesystem.writeFile` treats `/`
  as a path separator.
- No Android SDK in dev sandboxes: verify with `npm run build` + Playwright
  against `npm run dev`; Gradle verification happens in CI.
- `TODO.md` is the honest per-feature status ledger — update it with every change.
