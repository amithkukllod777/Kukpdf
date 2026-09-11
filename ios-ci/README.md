# KukPDF — iOS build (local Mac / Xcode)

The app is Capacitor-based, so iOS builds like any Capacitor app. `ios/` is **not
committed** (it's generated from the web build + `capacitor.config.ts`), so run
these once on your Mac to produce the Xcode project, then build/sign/ship with
your usual pipeline.

```bash
# from the repo root, on macOS with Xcode + CocoaPods installed
npm install
npm run build                 # builds the web app into dist/
npx cap add ios               # scaffolds ios/ + runs pod install  (first time)
# (later, instead of add:  npm run ios:sync )

# app icons from resources/icon.png (1024×1024)
npx @capacitor/assets generate --ios --iconBackgroundColor '#FFFFFF' --iconBackgroundColorDark '#FFFFFF'

# camera/photo permission strings + kukpdf://auth deep link (REQUIRED)
bash ios-ci/patch-infoplist.sh

npm run ios:open              # opens ios/App/App.xcworkspace in Xcode
```

In Xcode: pick your team/signing, then Run (device/simulator) or
Product → Archive → distribute to TestFlight / App Store.

## Already set for you
- **Display name:** `Kuk Pdf`  ·  **Bundle id:** `com.kuklabs.pdf`
  (from `capacitor.config.ts`)
- **Permissions + deep link:** applied by `patch-infoplist.sh` (re-run it after any
  fresh `cap add ios`)

## Notes
- **ML Kit Document Scanner is Android-only** — on iOS the app automatically falls
  back to the plain camera + manual crop (`src/capacitor/documentScanner.ts`
  guards on `getPlatform() === 'android'`), so nothing to configure on iOS.
- The GitHub Actions `build-ios.yml` does the same steps on a macOS runner
  (unsigned) — only useful if you enable GitHub-hosted macOS runners; building on
  your own Mac is simpler and is the intended path.
