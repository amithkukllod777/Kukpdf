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

# iOS minimum deployment target → 15.0. Apple warns (ITMS-90068) below 15.0 and
# requires it from Spring 2027; Capacitor scaffolds a lower default. Bump the
# Podfile + Xcode project, then re-run pod install so pods match. (macOS sed.)
POD="$(dirname "$PLIST")/../Podfile"          # ios/App/Podfile
PBX="$(dirname "$PLIST")/../App.xcodeproj/project.pbxproj"
[ -f "$POD" ] && sed -i '' -E "s/platform :ios, '[0-9.]+'/platform :ios, '15.0'/" "$POD" || true
[ -f "$PBX" ] && sed -i '' -E "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = 15.0;/g" "$PBX" || true
if [ -f "$POD" ]; then ( cd "$(dirname "$POD")" && pod install >/dev/null 2>&1 ) || echo "patch-infoplist: pod install re-run skipped (run it manually if pods changed)"; fi

# Sign in with Apple entitlement (required by @capacitor-community/apple-sign-in;
# App Store Guideline 4.8 since we offer Google sign-in). Create the entitlements
# file and wire it into the App target if not already referenced. In Xcode this
# is the "Sign in with Apple" capability — one click — if you prefer the GUI.
ENT="$(dirname "$PLIST")/App.entitlements"    # ios/App/App/App.entitlements
if [ ! -f "$ENT" ] || ! grep -q "applesignin" "$ENT"; then
  cat > "$ENT" <<'ENT_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.applesignin</key>
  <array><string>Default</string></array>
</dict>
</plist>
ENT_EOF
fi
if [ -f "$PBX" ] && ! grep -q "CODE_SIGN_ENTITLEMENTS" "$PBX"; then
  echo "patch-infoplist: NOTE — App.entitlements created. In Xcode, App target →"
  echo "  Signing & Capabilities → + Capability → 'Sign in with Apple' (one click)."
  echo "  (That wires CODE_SIGN_ENTITLEMENTS to App/App.entitlements.)"
fi

echo "patch-infoplist: done → $PLIST (min iOS 15.0, Sign in with Apple entitlement)"
