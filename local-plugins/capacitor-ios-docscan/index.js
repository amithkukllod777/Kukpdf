import { registerPlugin } from '@capacitor/core';

/**
 * VisionKit document scanner (iOS). Native implementation lives in
 * ios/Plugin/DocumentScannerPlugin.swift. There is no web implementation — the
 * app gates all calls to iOS, so on web/Android these methods are never invoked.
 */
export const DocumentScanner = registerPlugin('DocumentScanner');
