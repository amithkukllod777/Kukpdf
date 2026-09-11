import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuklabs.pdf',
  appName: 'Kuk Pdf',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
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
