import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuklabs.pdf',
  appName: 'Kuk PDF',
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
  }
};

export default config;
