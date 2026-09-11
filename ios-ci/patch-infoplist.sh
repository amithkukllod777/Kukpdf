#!/usr/bin/env bash
# KukPDF — inject the iOS Info.plist entries Capacitor doesn't manage:
#   • camera + photo-library usage strings (App Store REQUIRES these; the app
#     crashes on camera/photo access without them)
#   • the kukpdf://auth URL scheme for the Google sign-in deep link
#     (must match the backend APP_SCHEMES["kukpdf"] entry — KUKLABS_IDENTITY §3.1)
#
# Run on macOS AFTER `npx cap add ios` (the ios/ project is generated, not
# committed). Safe to re-run. Usage:  bash ios-ci/patch-infoplist.sh
set -e
PLIST="${1:-ios/App/App/Info.plist}"
[ -f "$PLIST" ] || { echo "Info.plist not found at $PLIST — run 'npx cap add ios' first."; exit 1; }

setstr() {
  /usr/libexec/PlistBuddy -c "Add :$1 string $2" "$PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Set :$1 $2" "$PLIST"
}

# Export-compliance: KukPDF uses only standard HTTPS / system crypto (no custom
# encryption) → declare exempt. Missing this is a common cause of Apple HOLDING a
# build in "processing" and silently dropping it, or nagging for a compliance answer.
/usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST"

# Display / bundle name (belt-and-braces; Capacitor also sets these from appName).
setstr CFBundleDisplayName "Kuk PDF Scan"
setstr CFBundleName        "Kuk PDF Scan"

setstr NSCameraUsageDescription      "Kuk PDF Scan uses the camera to scan documents into PDFs."
setstr NSPhotoLibraryUsageDescription "Kuk PDF Scan needs access to your photos to import images into PDFs."
setstr NSPhotoLibraryAddUsageDescription "Kuk PDF Scan saves exported files to your photo library."

if ! /usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes" "$PLIST" 2>/dev/null | grep -q kukpdf; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string com.kuklabs.pdf" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string kukpdf" "$PLIST"
fi

echo "patch-infoplist: done → $PLIST"
