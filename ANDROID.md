# KukPDF Android Build

This repo is now prepared for an Android app using Capacitor.

## First build

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Android Studio will open the native Android project. From there:

1. Wait for Gradle sync.
2. Connect Android phone or start emulator.
3. Click Run.

## Future native scanner plan

Current Android version wraps the KukPDF PWA and supports upload/camera input through browser/Capacitor capabilities.

Next native upgrade should add:

- Kotlin CameraX scanner screen
- Google ML Kit Document Scanner
- Auto edge detection
- Perspective crop
- Native multi-page scan
- Native PDF export bridge
- OCR bridge

## Package

Android package id:

```text
com.kuklabs.kukpdf
```

## Release APK/AAB

In Android Studio:

```text
Build > Generate Signed Bundle / APK > Android App Bundle
```

Use AAB for Play Store.
