import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuklabs.pdf',
  appName: 'Kuk PDF Scan',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    // Native "Continue with Google" (iOS) via Firebase Auth — uses the app's
    // GoogleService-Info.plist. skipNativeAuth stays false so the plugin returns
    // Google's id_token for the shared backend's native-exchange.
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com']
    },
    // FCM/APNs push — foreground presentation on iOS.
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true
  },
  ios: {
    // Keep the web layout below the notch/status bar and above the home
    // indicator; the app draws its own bottom nav so we don't want it under
    // the safe-area inset.
    contentInset: 'always'
  }
};

export default config;
